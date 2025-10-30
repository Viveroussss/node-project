import React, { useMemo, useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './EditArticleModal.css';
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

export default function EditArticleModal({ article, onClose, onSaved }) {
	const [title, setTitle] = useState(article?.title ?? '');
	const [content, setContent] = useState(article?.content ?? '');
	const [saving, setSaving] = useState(false);
    const [contentTouched, setContentTouched] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);

	useEffect(() => {
		setTitle(article?.title ?? '');
		setContent(article?.content ?? '');
	}, [article]);

	const titleError = useMemo(() => (title.trim().length === 0 ? 'Title is required' : ''), [title]);
	const contentError = useMemo(() => (isHtmlEffectivelyEmpty(content) ? 'Content is required' : ''), [content]);
	const isValid = titleError === '' && contentError === '';

    async function handleSave() {
        setSubmitAttempted(true);
		if (!isValid) return;
		setSaving(true);
		try {
			const res = await fetch(`/api/articles/${article.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: title.trim(), content })
			});
			if (!res.ok) {
				const msg = await res.json().catch(() => ({}));
				throw new Error(msg.error || `Failed to update (${res.status})`);
			}
			const saved = await res.json();
			onSaved?.(saved);
		} catch (e) {
			alert(e.message || 'Failed to update');
		} finally {
			setSaving(false);
		}
	}

	if (!article) return null;

    return (
		<div className="modal-overlay">
			<div className="card modal-card">
				<h3 className="header-title">Edit Article</h3>
				<div className="form-grid">
					<label>
						<span className="field-label">Title</span>
						<input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
					</label>
					{titleError && <div className="error-text">{titleError}</div>}
                    <div>
                        <span className="field-label">Content</span>
                        <ReactQuill
                            className="quill"
                            theme="snow"
                            value={content}
                            onChange={setContent}
                            onBlur={() => setContentTouched(true)}
                        />
                    </div>
                    {(contentTouched || submitAttempted) && contentError && <div className="error-text">{contentError}</div>}
					<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
						<Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
						<Button onClick={handleSave} type="button" disabled={saving || !isValid}>{saving ? 'Saving…' : 'Save'}</Button>
					</div>
				</div>
			</div>
		</div>
	);
}


