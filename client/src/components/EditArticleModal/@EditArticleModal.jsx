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

export default function EditArticleModal({ article, onClose, onSaved, workspaces = [] }) {
	const [title, setTitle] = useState(article?.title ?? '');
	const [content, setContent] = useState(article?.content ?? '');
	const [workspaceId, setWorkspaceId] = useState(article?.workspaceId ?? null);
	const [attachments, setAttachments] = useState(article?.attachments ?? []);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState('');
    const [contentTouched, setContentTouched] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);

	useEffect(() => {
		setTitle(article?.title ?? '');
		setContent(article?.content ?? '');
		setWorkspaceId(article?.workspaceId ?? null);
		setAttachments(article?.attachments ?? []);
	}, [article]);

	const titleError = useMemo(() => (title.trim().length === 0 ? 'Title is required' : ''), [title]);
	const contentError = useMemo(() => (isHtmlEffectivelyEmpty(content) ? 'Content is required' : ''), [content]);
	const isValid = titleError === '' && contentError === '';

	async function handleFileUpload(e) {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
		const invalidFiles = files.filter(f => !allowedTypes.includes(f.type));
		if (invalidFiles.length > 0) {
			setUploadError('Only images (JPG, PNG, GIF, WEBP) and PDF files are allowed');
			return;
		}

		const maxSize = 10 * 1024 * 1024;
		const oversizedFiles = files.filter(f => f.size > maxSize);
		if (oversizedFiles.length > 0) {
			setUploadError(`File size limit is 10MB. ${oversizedFiles.map(f => f.name).join(', ')} ${oversizedFiles.length === 1 ? 'is' : 'are'} too large.`);
			return;
		}

		setUploading(true);
		setUploadError('');
		try {
			const formData = new FormData();
			files.forEach(file => formData.append('files', file));

			const res = await fetch(`/api/articles/${article.id}/attachments`, {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				const msg = await res.json().catch(() => ({}));
				throw new Error(msg.error || 'Failed to upload files');
			}

			const data = await res.json();
			setAttachments(data.article.attachments || []);
			e.target.value = '';
		} catch (e) {
			setUploadError(e.message || 'Failed to upload files');
		} finally {
			setUploading(false);
		}
	}

	async function handleDeleteAttachment(attachmentId) {
		if (!confirm('Delete this attachment?')) return;
		try {
			const res = await fetch(`/api/articles/${article.id}/attachments/${attachmentId}`, {
				method: 'DELETE'
			});
			if (!res.ok) {
				const msg = await res.json().catch(() => ({}));
				throw new Error(msg.error || 'Failed to delete attachment');
			}
			const data = await res.json();
			setAttachments(data.article.attachments || []);
		} catch (e) {
			alert(e.message || 'Failed to delete attachment');
		}
	}

	const formatFileSize = (bytes) => {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	};

    async function handleSave() {
        setSubmitAttempted(true);
		if (!isValid) return;
		setSaving(true);
		try {
			const res = await fetch(`/api/articles/${article.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: title.trim(), content, workspaceId: workspaceId || null, attachments })
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
					{workspaces.length > 0 && (
						<label>
							<span className="field-label">Workspace</span>
							<select
								className="input"
								value={workspaceId || ''}
								onChange={(e) => setWorkspaceId(e.target.value || null)}
							>
								<option value="">No Workspace</option>
								{workspaces.map(ws => (
									<option key={ws.id} value={ws.id}>{ws.name}</option>
								))}
							</select>
						</label>
					)}
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
					
					<div>
						<span className="field-label">Attachments</span>
						<div className="attachments-upload-section">
							<label className="file-upload-label">
								<input
									type="file"
									multiple
									accept="image/*,.pdf"
									onChange={handleFileUpload}
									disabled={uploading}
									style={{ display: 'none' }}
									id={`file-upload-${article.id}`}
								/>
								<button
									type="button"
									className="file-upload-button"
									onClick={() => document.getElementById(`file-upload-${article.id}`)?.click()}
									disabled={uploading}
								>
									{uploading ? 'Uploading…' : 'Upload Files'}
								</button>
								<span className="file-upload-hint">Images (JPG, PNG, GIF, WEBP) and PDFs only</span>
							</label>
							{uploadError && <div className="error-text">{uploadError}</div>}
						</div>
						
						{attachments.length > 0 && (
							<div className="attachments-list-edit">
								{attachments.map((att) => (
									<div key={att.id} className="attachment-item-edit">
										<div className="attachment-icon">{att.mimetype.startsWith('image/') ? '🖼️' : '📄'}</div>
										<div className="attachment-info">
											<div className="attachment-name">{att.originalName}</div>
											<div className="attachment-meta">{formatFileSize(att.size)}</div>
										</div>
										<Button
											type="button"
											variant="secondary"
											onClick={() => handleDeleteAttachment(att.id)}
											className="btn-compact"
										>
											Delete
										</Button>
									</div>
								))}
							</div>
						)}
					</div>

					<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
						<Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
						<Button onClick={handleSave} type="button" disabled={saving || !isValid}>{saving ? 'Saving…' : 'Save'}</Button>
					</div>
				</div>
			</div>
		</div>
	);
}


