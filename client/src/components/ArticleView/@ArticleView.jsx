import React, { useEffect, useState } from 'react';
import './ArticleView.css';
import Button from '../Button/@Button.jsx';

export default function ArticleView({ id, totalCount = 0 }) {
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
	}, [id]);

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
					<h3 className="article-title">{article.title}</h3>
					<div dangerouslySetInnerHTML={{ __html: article.content }} />
				</div>
			)}
		</div>
	);
}


