import React, { useState } from 'react';
import './ArticlesList.css';
import Button from '../Button/@Button.jsx';

export default function ArticlesList({ items, selectedId, onSelect, onEdit, onDelete }) {
	const [openMenuId, setOpenMenuId] = useState(null);

	if (!items || items.length === 0) {
		return <div>No articles yet.</div>;
	}
	return (
		<ul className="list">
			{items.map((a) => (
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
									<Button
										type="button"
										variant="compact"
										onClick={() => { onEdit?.(a.id); setOpenMenuId(null); }}
									>
										Edit
									</Button>
									<Button
										type="button"
										variant="compact"
										onClick={() => { onDelete?.(a.id); setOpenMenuId(null); }}
									>
										Delete
									</Button>
								</div>
							</div>
						)}
					</div>
				</li>
			))}
		</ul>
	);
}

