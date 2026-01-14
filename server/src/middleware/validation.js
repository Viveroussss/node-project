import { isHtmlEffectivelyEmpty } from '../utils/validation.js';

export function validateArticle(req, res, next) {
	const { title, content } = req.body ?? {};
	if (typeof title !== 'string' || title.trim().length === 0) {
		return res.status(400).json({ error: 'Title is required' });
	}
	if (typeof content !== 'string' || isHtmlEffectivelyEmpty(content)) {
		return res.status(400).json({ error: 'Content is required' });
	}
	next();
}

export function validateWorkspace(req, res, next) {
	const { name } = req.body ?? {};
	if (typeof name !== 'string' || name.trim().length === 0) {
		return res.status(400).json({ error: 'Name is required' });
	}
	next();
}

export function validateComment(req, res, next) {
	const { content } = req.body ?? {};
	if (typeof content !== 'string' || content.trim().length === 0) {
		return res.status(400).json({ error: 'Content is required' });
	}
	next();
}


