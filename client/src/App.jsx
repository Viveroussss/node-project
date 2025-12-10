import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import ArticlesList from './components/ArticlesList/@ArticlesList.jsx';
import ArticleView from './components/ArticleView/@ArticleView.jsx';
import NewArticleForm from './components/NewArticleForm/@NewArticleForm.jsx';
import EditArticleModal from './components/EditArticleModal/@EditArticleModal.jsx';
import Button from './components/Button/@Button.jsx';

export default function App() {
	const [articles, setArticles] = useState([]);
	const [workspaces, setWorkspaces] = useState([]);
	const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
	const [selectedId, setSelectedId] = useState(null);
	const [loadingList, setLoadingList] = useState(false);
	const [error, setError] = useState('');
	const [editingArticle, setEditingArticle] = useState(null);
	const [showNewArticleForm, setShowNewArticleForm] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [articleRefreshKey, setArticleRefreshKey] = useState(0);
	const wsRef = useRef(null);

	async function refreshWorkspaces() {
		try {
			const res = await fetch('/api/workspaces');
			if (!res.ok) throw new Error('Failed to fetch workspaces');
			const data = await res.json();
			setWorkspaces(data);
			if (data.length && !selectedWorkspaceId) {
				setSelectedWorkspaceId(data[0].id);
			}
		} catch (e) {
			console.error('Failed to load workspaces:', e);
		}
	}

async function refreshList() {
		setLoadingList(true);
		setError('');
		try {
			const url = selectedWorkspaceId 
				? `/api/articles?workspaceId=${selectedWorkspaceId}`
				: '/api/articles';
			const res = await fetch(url);
			if (!res.ok) throw new Error('Failed to fetch');
			const data = await res.json();
			setArticles(data);
			if (data.length && !selectedId) setSelectedId(data[0].id);
			if (selectedId && !data.find((a) => a.id === selectedId)) {
				setSelectedId(data[0]?.id ?? null);
			}
        return data;
		} catch (e) {
			setError('Could not load articles.');
        return [];
		} finally {
			setLoadingList(false);
		}
	}

	useEffect(() => {
		refreshWorkspaces();
	}, []);

	useEffect(() => {
		refreshList();
	}, [selectedWorkspaceId]);

	useEffect(() => {
		const wsUrl = process.env.NODE_ENV === 'production' 
			? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
			: 'ws://localhost:3001';
		const ws = new WebSocket(wsUrl);

		ws.onopen = () => {
			console.log('WebSocket connected');
		};

			ws.onmessage = (event) => {
			try {
				const notification = JSON.parse(event.data);
				setNotifications(prev => [...prev, { ...notification, id: Date.now(), timestamp: Date.now() }]);
				
				refreshList();
				
				if (notification.articleId === selectedId) {
					setArticleRefreshKey(prev => prev + 1);
				}
			} catch (e) {
				console.error('Failed to parse WebSocket message', e);
			}
		};

		ws.onerror = (error) => {
			console.error('WebSocket error', error);
		};

		ws.onclose = () => {
			console.log('WebSocket disconnected, reconnecting...');

		};

		wsRef.current = ws;

		return () => {
			if (wsRef.current) {
				wsRef.current.close();
			}
		};
	}, [selectedId]);

	useEffect(() => {
		if (notifications.length === 0) return;
		const timer = setTimeout(() => {
			setNotifications(prev => prev.slice(1));
		}, 5000);
		return () => clearTimeout(timer);
	}, [notifications]);

	async function handleDelete(id) {
		if (!confirm('Delete this article?')) return;
		try {
			const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
            if (res.status === 204) {
                const updated = await refreshList();
                if (selectedId === id) {
                    setSelectedId(updated[0]?.id ?? null);
                }
			} else if (res.status === 404) {
				alert('Article not found');
			} else {
				const msg = await res.json().catch(() => ({}));
				alert(msg.error || 'Failed to delete');
			}
		} catch (e) {
			alert(e.message || 'Failed to delete');
		}
	}

	async function openEdit(id) {
		try {
			const res = await fetch(`/api/articles/${id}`);
			if (!res.ok) throw new Error('Failed to load article');
			const art = await res.json();
			setEditingArticle(art);
		} catch (e) {
			alert(e.message || 'Failed to load');
		}
	}

	async function handleSaved(updated) {
		setEditingArticle(null);
		await refreshList();
		setSelectedId(updated.id);
	}

	return (
		<div>
			<header>
				<div className="container">
					<h2 className="header-title">Articles</h2>
				</div>
			</header>
			{notifications.length > 0 && (
				<div className="notifications-container">
					{notifications.map((notif) => (
						<div key={notif.id} className="notification">
							<div className="notification-icon">
								{notif.type === 'attachment_added' ? '📎' : notif.type === 'article_updated' ? '✏️' : '📝'}
							</div>
							<div className="notification-content">
								<div className="notification-message">{notif.message}</div>
								<div className="notification-time">{new Date(notif.timestamp).toLocaleTimeString()}</div>
							</div>
							<button
								className="notification-close"
								onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
							>
								×
							</button>
						</div>
					))}
				</div>
			)}
			<div className="container">
				<div className="layout">
					<div className="card">
						<div className="section-header">
							<strong>Workspaces</strong>
						</div>
						<div style={{ marginBottom: '12px' }}>
							<select 
								className="input"
								value={selectedWorkspaceId || ''}
								onChange={(e) => setSelectedWorkspaceId(e.target.value || null)}
								style={{ width: '100%', marginBottom: '8px' }}
							>
								<option value="">All Workspaces</option>
								{workspaces.map(ws => (
									<option key={ws.id} value={ws.id}>{ws.name}</option>
								))}
							</select>
						</div>
						<div className="section-header">
							<strong>My Articles</strong>
						</div>
						<div style={{ marginBottom: '12px' }}>
							<Button onClick={() => setShowNewArticleForm(true)}>+ New Article</Button>
						</div>
						{error && <div className="error-text">{error}</div>}
						<ArticlesList
							items={articles}
							selectedId={selectedId}
							onSelect={setSelectedId}
							onEdit={openEdit}
							onDelete={handleDelete}
						/>
						<div className="footer">{articles.length} article(s)</div>
					</div>
					<div className="grid-stack">
                        <ArticleView key={articleRefreshKey} id={selectedId} totalCount={articles.length} />
					</div>
				</div>
			</div>
			{showNewArticleForm && (
				<NewArticleForm
					key={showNewArticleForm ? 'new-article-form' : undefined}
					workspaces={workspaces}
					selectedWorkspaceId={selectedWorkspaceId}
					onClose={() => setShowNewArticleForm(false)}
					onCreated={(a) => {
						setSelectedId(a.id);
						refreshList();
						setShowNewArticleForm(false);
					}}
				/>
			)}
			{editingArticle && (
				<EditArticleModal
					article={editingArticle}
					workspaces={workspaces}
					onClose={() => setEditingArticle(null)}
					onSaved={handleSaved}
				/>
			)}
		</div>
	);
}

