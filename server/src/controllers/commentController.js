import * as commentService from '../services/commentService.js';
import { Article } from '../config/database.js';
import { broadcastNotification } from '../utils/websocket.js';
import { handleDatabaseError } from '../middleware/errorHandler.js';

export async function getCommentsByArticle(req, res) {
	try {
		const comments = await commentService.getCommentsByArticleId(req.params.id);
		res.json(comments);
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to read comments');
	}
}

export async function createComment(req, res) {
	try {
		const { content, author } = req.body ?? {};
		const comment = await commentService.createComment(req.params.id, { content, author });
		
		if (!comment) return res.status(404).json({ error: 'Article not found' });
		
		const article = await Article.findByPk(req.params.id);
		broadcastNotification({
			type: 'comment_added',
			articleId: article.id,
			title: article.title,
			message: `New comment added to "${article.title}"`
		});
		
		res.status(201).json(comment);
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to create comment');
	}
}

export async function updateComment(req, res) {
	try {
		const { content } = req.body ?? {};
		const comment = await commentService.updateComment(req.params.id, { content });
		if (!comment) return res.status(404).json({ error: 'Comment not found' });
		res.json(comment);
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to update comment');
	}
}

export async function deleteComment(req, res) {
	try {
		const ok = await commentService.deleteComment(req.params.id);
		if (!ok) return res.status(404).json({ error: 'Comment not found' });
		res.status(204).send();
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to delete comment');
	}
}


