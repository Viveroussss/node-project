import React, { useEffect, useState } from 'react';
import './ArticleView.css';
import Button from '../Button/@Button.jsx';
import Comments from '../Comments/@Comments.jsx';

export default function ArticleView({ id, totalCount = 0, refreshKey = 0 }) {
	const [article, setArticle] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		let ignore = false;
		async function load() {
            if (!id) {
                setArticle(null);
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
				if (!ignore) setArticle(data);
			} catch (e) {
				if (!ignore) setError('Could not load the article.');
			} finally {
				if (!ignore) setLoading(false);
			}
		}
		load();
		return () => { ignore = true; };
	}, [id, refreshKey]);

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
							fetch(`/api/articles/${id}`)
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


