import React, { useState } from 'react';
import './Comments.css';
import Button from '../Button/@Button.jsx';
import { authService } from '../../services/authService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3001');

export default function Comments({ articleId, comments = [], onCommentAdded }) {
	const [newComment, setNewComment] = useState('');
	const [author, setAuthor] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const { logout } = useAuth();
	const navigate = useNavigate();

	async function handleSubmit(e) {
		e?.preventDefault?.();
		if (!newComment.trim()) {
			setError('Comment cannot be empty');
			return;
		}
		setSubmitting(true);
		setError('');
		try {
			const res = await fetch(`${API_BASE_URL}/api/articles/${articleId}/comments`, {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					...authService.getAuthHeader()
				},
				body: JSON.stringify({
					content: newComment.trim(),
					author: author.trim() || 'Anonymous'
				})
			});
			if (!res.ok) {
				if (res.status === 401 || res.status === 403) {
					logout();
					navigate('/login');
					return;
				}
				const msg = await res.json().catch(() => ({}));
				throw new Error(msg.error || 'Failed to add comment');
			}
			const created = await res.json();
			setNewComment('');
			setAuthor('');
			onCommentAdded?.(created);
		} catch (e) {
			setError(e.message || 'Failed to add comment');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="comments-section">
			<div className="comments-header">
				<strong>Comments ({comments.length})</strong>
			</div>
			
			<div className="comments-list">
				{comments.length === 0 ? (
					<div className="no-comments">No comments yet. Be the first to comment!</div>
				) : (
					comments.map((comment) => (
						<div key={comment.id} className="comment-item">
							<div className="comment-header">
								<span className="comment-author">{comment.author}</span>
								<span className="comment-date">
									{new Date(comment.createdAt).toLocaleString()}
								</span>
							</div>
							<div className="comment-content">{comment.content}</div>
						</div>
					))
				)}
			</div>

			<form onSubmit={handleSubmit} className="comment-form">
				<div className="comment-form-row">
					<input
						type="text"
						className="input comment-author-input"
						placeholder="Your name (optional)"
						value={author}
						onChange={(e) => setAuthor(e.target.value)}
					/>
				</div>
				<textarea
					className="input comment-input"
					placeholder="Write a comment..."
					value={newComment}
					onChange={(e) => {
						setNewComment(e.target.value);
						setError('');
					}}
					rows={3}
				/>
				{error && <div className="error-text">{error}</div>}
				<div style={{ marginTop: '8px' }}>
					<Button type="submit" disabled={submitting || !newComment.trim()}>
						{submitting ? 'Posting...' : 'Post Comment'}
					</Button>
				</div>
			</form>
		</div>
	);
}

