import React, { useEffect, useState } from 'react';
import './ArticleView.css';
import Button from '../Button/@Button.jsx';
import Comments from '../Comments/@Comments.jsx';

export default function ArticleView({ id, totalCount = 0, refreshKey = 0, onEdit }) {
	const [article, setArticle] = useState(null);
	const [versions, setVersions] = useState([]);
	const [selectedVersion, setSelectedVersion] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		let ignore = false;
		async function load() {
            if (!id) {
                setArticle(null);
				setVersions([]);
				setSelectedVersion(null);
                setError('');
                setLoading(false);
                return;
            }
			setLoading(true);
			setError('');
			try {
				const res = await fetch(`/api/articles/${id}`);
				if (!res.ok) throw new Error('Failed to fetch');
				const data = await res.json();
				if (!ignore) {
					setArticle(data);
					setSelectedVersion(null);
				}

				try {
					const versionsRes = await fetch(`/api/articles/${id}/versions`);
					if (versionsRes.ok) {
						const versionsData = await versionsRes.json();
						if (!ignore) setVersions(versionsData);
					}
				} catch (e) {
					console.warn('Could not load versions:', e);
				}
			} catch (e) {
				if (!ignore) setError('Could not load the article.');
			} finally {
				if (!ignore) setLoading(false);
			}
		}
		load();
		return () => { ignore = true; };
	}, [id, refreshKey]);

	useEffect(() => {
		if (!id || selectedVersion === null) return;
		
		let ignore = false;
		async function loadVersion() {
			setLoading(true);
			try {
				const res = await fetch(`/api/articles/${id}?version=${selectedVersion}`);
				if (!res.ok) throw new Error('Failed to fetch version');
				const data = await res.json();
				if (!ignore) setArticle(data);
			} catch (e) {
				if (!ignore) setError('Could not load the version.');
			} finally {
				if (!ignore) setLoading(false);
			}
		}
		loadVersion();
		return () => { ignore = true; };
	}, [id, selectedVersion]);

	const handleAttachmentClick = (attachment) => {
		const url = `/api/attachments/${attachment.filename}`;
		if (attachment.mimetype.startsWith('image/')) {
			window.open(url, '_blank');
		} else if (attachment.mimetype === 'application/pdf') {
			window.open(url, '_blank');
		} else {
			window.open(url, '_blank');
		}
	};

	const formatFileSize = (bytes) => {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	};

	const handleVersionChange = (e) => {
		const version = e.target.value === 'current' ? null : parseInt(e.target.value, 10);
		setSelectedVersion(version);
	};

	const isViewingVersion = article?.isVersion === true;

	return (
		<div className="card">
			{!id && (totalCount === 0 ? (
				<div>
					<div>No articles yet. Create one to preview.</div>
				</div>
			) : <div>Select an article to view.</div>)}
			{loading && <div>Loading…</div>}
            {error && <div className="error-text">{error}</div>}
            {id && article && (
				<div>
					{(versions.length > 0 || article.currentVersion) && (
						<div className="version-section">
							<div className="version-header">
								<label htmlFor="version-select" style={{ marginRight: '8px', fontWeight: '500' }}>
									Version:
								</label>
								<select
									id="version-select"
									className="version-select"
									value={selectedVersion === null ? 'current' : selectedVersion}
									onChange={handleVersionChange}
								>
									<option value="current">
										Current (v{article.currentVersion || versions.length + 1})
									</option>
									{versions.map((v) => (
										<option key={v.id} value={v.versionNumber}>
											Version {v.versionNumber} - {new Date(v.createdAt).toLocaleString()}
										</option>
									))}
								</select>
							</div>
							{isViewingVersion && (
								<div className="version-warning">
									⚠️ You are viewing an old version (v{article.versionNumber}). This version is read-only.
								</div>
							)}
						</div>
					)}

					{article.attachments && article.attachments.length > 0 && (
						<div className="attachments-section">
							<div className="attachments-header">
								<strong>Attachments ({article.attachments.length})</strong>
							</div>
							<div className="attachments-list">
								{article.attachments.map((att) => (
									<div key={att.id} className="attachment-item" onClick={() => handleAttachmentClick(att)}>
										<div className="attachment-icon">
											{att.mimetype.startsWith('image/') ? '🖼️' : '📄'}
										</div>
										<div className="attachment-info">
											<div className="attachment-name">{att.originalName}</div>
											<div className="attachment-meta">{formatFileSize(att.size)}</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
					<h3 className="article-title">{article.title}</h3>
					<div dangerouslySetInnerHTML={{ __html: article.content }} />
					
					<Comments 
						articleId={id} 
						comments={article.comments || []}
						onCommentAdded={() => {
							const url = selectedVersion === null 
								? `/api/articles/${id}`
								: `/api/articles/${id}?version=${selectedVersion}`;
							fetch(url)
								.then(res => res.json())
								.then(data => setArticle(data))
								.catch(err => console.error('Failed to refresh comments:', err));
						}}
					/>
				</div>
			)}
		</div>
	);
}


