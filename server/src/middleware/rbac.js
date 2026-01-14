import { Article } from '../config/database.js';

export function requireAdmin(req, res, next) {
	if (!req.user) {
		return res.status(401).json({ error: 'Authentication required' });
	}
	if (req.user.role !== 'admin') {
		return res.status(403).json({ error: 'Admin access required' });
	}
	next();
}

export async function requireArticleOwnerOrAdmin(req, res, next) {
	try {
		if (!req.user || !req.user.userId) {
			return res.status(401).json({ error: 'Authentication required' });
		}

		const article = await Article.findByPk(req.params.id);
		if (!article) {
			return res.status(404).json({ error: 'Article not found' });
		}

		if (!article.userId) {
			if (req.user.role === 'admin') {
				return next();
			}
			return res.status(403).json({ error: 'You do not have permission to edit this article' });
		}

		const isOwner = article.userId === req.user.userId;
		const isAdmin = req.user.role === 'admin';

		if (!isOwner && !isAdmin) {
			return res.status(403).json({ error: 'You do not have permission to edit this article' });
		}

		next();
	} catch (err) {
		console.error('Error in requireArticleOwnerOrAdmin:', err);
		return res.status(500).json({ error: 'Failed to check article permissions', details: err.message });
	}
}

