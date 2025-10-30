import React, { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './NewArticleForm.css';
import Button from '../Button/@Button.jsx';

function isHtmlEffectivelyEmpty(html) {
	if (typeof html !== 'string') return true;
	const text = html
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return text.length === 0;
}

export default function NewArticleForm({ onCreated, resetOn }) {
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState('');

	const [titleTouched, setTitleTouched] = useState(false);
	const [contentTouched, setContentTouched] = useState(false);
	const [submitAttempted, setSubmitAttempted] = useState(false);

	useEffect(() => {
		setTitleTouched(false);
		setContentTouched(false);
		setSubmitAttempted(false);
		setSuccess('');
	}, [resetOn]);

	const titleError = useMemo(() => {
		return title.trim().length === 0 ? 'Title is required' : '';
	}, [title]);
	const contentError = useMemo(() => {
		return isHtmlEffectivelyEmpty(content) ? 'Content is required' : '';
	}, [content]);

	const isValid = titleError === '' && contentError === '';

	useEffect(() => {
		if (!success) return;
		const t = setTimeout(() => setSuccess(''), 2500);
		return () => clearTimeout(t);
	}, [success]);

	function handleTitleChange(e) {
		setTitle(e.target.value);
		setTitleTouched(true);
		if (success) setSuccess('');
	}
    function handleContentChange(val) {
		setContent(val);
		if (success) setSuccess('');
	}

	async function handleSubmit(e) {
		e?.preventDefault?.();
		setSubmitAttempted(true);
		if (!isValid) {
			return;
		}
		setSubmitting(true);
		try {
			const payload = { title: title.trim(), content };
			const res = await fetch('/api/articles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				const msg = await res.json().catch(() => ({}));
				throw new Error(msg.error || `Failed to create (${res.status})`);
			}
			const created = await res.json();
			setTitle('');
			setContent('');
			setTitleTouched(false);
			setContentTouched(false);
			setSubmitAttempted(false);
			setSuccess('Article created.');
			onCreated?.(created);
		} catch (e) {
			console.error(e);
		} finally {
			setSubmitting(false);
		}
	}

    return (
        <div className="card" id="create-form">
			<h3 className="header-title">New Article</h3>
			<form onSubmit={handleSubmit}>
				<div className="form-grid">
					<label>
						<span className="field-label">Title</span>
						<input
							type="text"
							className="input"
							value={title}
							onChange={handleTitleChange}
							onBlur={() => setTitleTouched(true)}
							placeholder="Enter a title"
							name="article-title"
						/>
					</label>
					{(titleTouched || submitAttempted) && titleError && (
						<div className="error-text">{titleError}</div>
					)}
                    <div>
                        <span className="field-label">Content</span>
                        <ReactQuill
                            className="quill"
                            theme="snow"
                            value={content}
                            onChange={handleContentChange}
                            onBlur={() => setContentTouched(true)}
                        />
                    </div>
					{(contentTouched || submitAttempted) && contentError && (
						<div className="error-text">{contentError}</div>
					)}
					{success && <div className="success-text">{success}</div>}
					<div>
						<Button type="button" onClick={handleSubmit} disabled={submitting || !isValid}>
							{submitting ? 'Saving…' : 'Create Article'}
						</Button>
					</div>
				</div>
			</form>
		</div>
	);
}


