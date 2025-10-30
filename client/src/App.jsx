import React, { useEffect, useState } from 'react';
import './App.css';
import ArticlesList from './components/ArticlesList/@ArticlesList.jsx';
import ArticleView from './components/ArticleView/@ArticleView.jsx';
import NewArticleForm from './components/NewArticleForm/@NewArticleForm.jsx';
import EditArticleModal from './components/EditArticleModal/@EditArticleModal.jsx';
import Button from './components/Button/@Button.jsx';

export default function App() {
	const [articles, setArticles] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [loadingList, setLoadingList] = useState(false);
	const [error, setError] = useState('');
	const [editingArticle, setEditingArticle] = useState(null);

async function refreshList() {
		setLoadingList(true);
		setError('');
		try {
			const res = await fetch('/api/articles');
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
		refreshList();
	}, []);

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
			<div className="container">
				<div className="layout">
					<div className="card">
						<div className="section-header">
							<strong>My Articles</strong>
                            <Button onClick={refreshList} disabled={loadingList}>Refresh</Button>
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
                        <ArticleView id={selectedId} totalCount={articles.length} />
						<NewArticleForm resetOn={selectedId} onCreated={(a) => { setSelectedId(a.id); refreshList(); }} />
					</div>
				</div>
			</div>
			{editingArticle && (
				<EditArticleModal
					article={editingArticle}
					onClose={() => setEditingArticle(null)}
					onSaved={handleSaved}
				/>
			)}
		</div>
	);
}

