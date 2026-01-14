import React, { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './NewArticleForm.css';
import Button from '../Button/@Button.jsx';
import { authService } from '../../services/authService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3001');

function isHtmlEffectivelyEmpty(html) {
	if (typeof html !== 'string') return true;
	const text = html
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return text.length === 0;
}

export default function NewArticleForm({ onCreated, onClose, workspaces = [], selectedWorkspaceId = null }) {
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [workspaceId, setWorkspaceId] = useState(selectedWorkspaceId);
	const [pendingFiles, setPendingFiles] = useState([]);
	const [submitting, setSubmitting] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState('');
	const [success, setSuccess] = useState('');
	const { logout } = useAuth();
	const navigate = useNavigate();

	const [titleTouched, setTitleTouched] = useState(false);
	const [contentTouched, setContentTouched] = useState(false);
	const [submitAttempted, setSubmitAttempted] = useState(false);

	useEffect(() => {
		setTitle('');
		setContent('');
		setPendingFiles([]);
		setTitleTouched(false);
		setContentTouched(false);
		setSubmitAttempted(false);
		setSuccess('');
		setUploadError('');
	}, []);

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

	async function handleFileSelect(e) {
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

		setPendingFiles(prev => [...prev, ...files]);
		setUploadError('');
		e.target.value = '';
	}

	function handleRemovePendingFile(index) {
		setPendingFiles(prev => prev.filter((_, i) => i !== index));
	}

	const formatFileSize = (bytes) => {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	};

	async function handleSubmit(e) {
		e?.preventDefault?.();
		setSubmitAttempted(true);
		if (!isValid) {
			return;
		}
		setSubmitting(true);
		try {
			const payload = { title: title.trim(), content, workspaceId: workspaceId || null };
			const res = await fetch(`${API_BASE_URL}/api/articles`, {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					...authService.getAuthHeader()
				},
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				if (res.status === 401 || res.status === 403) {
					logout();
					navigate('/login');
					return;
				}
				const msg = await res.json().catch(() => ({}));
				throw new Error(msg.error || `Failed to create (${res.status})`);
			}
			const created = await res.json();

			if (pendingFiles.length > 0) {
				setUploading(true);
				try {
					const formData = new FormData();
					pendingFiles.forEach(file => formData.append('files', file));

					const uploadRes = await fetch(`${API_BASE_URL}/api/articles/${created.id}/attachments`, {
						method: 'POST',
						headers: authService.getAuthHeader(),
						body: formData
					});

					if (!uploadRes.ok) {
						if (uploadRes.status === 401 || uploadRes.status === 403) {
							logout();
							navigate('/login');
							return;
						}
						const msg = await uploadRes.json().catch(() => ({}));
						throw new Error(msg.error || 'Failed to upload files');
					}

					const uploadData = await uploadRes.json();
					created.attachments = uploadData.article.attachments || [];
				} catch (uploadErr) {
					console.error('File upload error:', uploadErr);
				} finally {
					setUploading(false);
				}
			}

			setTitle('');
			setContent('');
			setPendingFiles([]);
			setTitleTouched(false);
			setContentTouched(false);
			setSubmitAttempted(false);
			setSuccess('Article created.');
			
			setTimeout(() => {
			onCreated?.(created);
				onClose?.();
			}, 500);
		} catch (e) {
			console.error(e);
			alert(e.message || 'Failed to create article');
		} finally {
			setSubmitting(false);
		}
	}

    return (
		<div className="modal-overlay">
			<div className="card modal-card">
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
                            onChange={handleContentChange}
                            onBlur={() => setContentTouched(true)}
                        />
                    </div>
					{(contentTouched || submitAttempted) && contentError && (
						<div className="error-text">{contentError}</div>
					)}
						
						<div>
							<span className="field-label">Attachments</span>
							<div className="attachments-upload-section">
								<label className="file-upload-label">
									<input
										type="file"
										multiple
										accept="image/*,.pdf"
										onChange={handleFileSelect}
										disabled={uploading}
										style={{ display: 'none' }}
										id="file-upload-new"
									/>
									<button
										type="button"
										className="file-upload-button"
										onClick={() => document.getElementById('file-upload-new')?.click()}
										disabled={uploading}
									>
										{uploading ? 'Uploading…' : 'Select Files'}
									</button>
									<span className="file-upload-hint">Images (JPG, PNG, GIF, WEBP) and PDFs only</span>
								</label>
								{uploadError && <div className="error-text">{uploadError}</div>}
							</div>
							
							{pendingFiles.length > 0 && (
								<div className="attachments-list-edit">
									{pendingFiles.map((file, index) => (
										<div key={index} className="attachment-item-edit">
											<div className="attachment-icon">
												{file.type.startsWith('image/') ? '🖼️' : '📄'}
											</div>
											<div className="attachment-info">
												<div className="attachment-name">{file.name}</div>
												<div className="attachment-meta">{formatFileSize(file.size)}</div>
											</div>
											<Button
												type="button"
												variant="secondary"
												onClick={() => handleRemovePendingFile(index)}
												className="btn-compact"
											>
												Remove
											</Button>
										</div>
									))}
								</div>
							)}
						</div>

					{success && <div className="success-text">{success}</div>}
						<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
							<Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
							<Button type="button" onClick={handleSubmit} disabled={submitting || uploading || !isValid}>
								{submitting || uploading ? 'Creating…' : 'Create Article'}
						</Button>
					</div>
				</div>
			</form>
			</div>
		</div>
	);
}


