import React, { useState } from 'react';
import './ArticlesList.css';
import Button from '../Button/@Button.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function ArticlesList({ items, selectedId, onSelect, onEdit, onDelete }) {
	const [openMenuId, setOpenMenuId] = useState(null);
	const { user } = useAuth();

	const canEdit = (article) => {
		if (!user) return false;
		return user.role === 'admin' || article.userId === user.id;
	};

	const canDelete = (article) => {
		if (!user) return false;
		return user.role === 'admin' || article.userId === user.id;
	};

	if (!items || items.length === 0) {
		return <div>No articles yet.</div>;
	}
	return (
		<ul className="list">
			{items.map((a) => {
				const hasEditPermission = canEdit(a);
				const hasDeletePermission = canDelete(a);
				const hasAnyPermission = hasEditPermission || hasDeletePermission;
				return (
					<li
						key={a.id}
						className={`${selectedId === a.id ? 'active' : ''} list-row`}
					>
						<div className="list-row-main" onClick={() => onSelect(a.id)}>
							<div className="list-row-line">
								<span className="title-ellipsize" title={a.title}>{a.title}</span>
								<small className="list-row-meta">{new Date(a.createdAt).toLocaleString()}</small>
							</div>
						</div>
						{hasAnyPermission && (
							<div className="actions-menu">
								<Button
									type="button"
									variant="ghost"
									onClick={() => setOpenMenuId(openMenuId === a.id ? null : a.id)}
								>
									⋯
								</Button>
								{openMenuId === a.id && (
									<div className="card actions-menu-panel">
										<div className="menu-grid">
											{hasEditPermission && (
												<Button
													type="button"
													variant="compact"
													onClick={() => { onEdit?.(a.id); setOpenMenuId(null); }}
												>
													Edit
												</Button>
											)}
											{hasDeletePermission && (
												<Button
													type="button"
													variant="compact"
													onClick={() => { onDelete?.(a.id); setOpenMenuId(null); }}
												>
													Delete
												</Button>
											)}
										</div>
									</div>
								)}
							</div>
						)}
					</li>
				);
			})}
		</ul>
	);
}

