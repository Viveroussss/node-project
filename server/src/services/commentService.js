import { nanoid } from 'nanoid';
import { Comment, Article } from '../config/database.js';

export async function getCommentsByArticleId(articleId) {
	return Comment.findAll({
		where: { articleId },
		order: [['createdAt', 'ASC']]
	});
}

export async function createComment(articleId, { content, author }) {
	const article = await Article.findByPk(articleId);
	if (!article) return null;
	
	return Comment.create({
		id: nanoid(12),
		articleId,
		content: content.trim(),
		author: author && typeof author === 'string' ? author.trim() : 'Anonymous'
	});
}

export async function updateComment(id, { content }) {
	const comment = await Comment.findByPk(id);
	if (!comment) return null;
	await comment.update({ content: content.trim() });
	return comment;
}

export async function deleteComment(id) {
	const comment = await Comment.findByPk(id);
	if (!comment) return false;
	await comment.destroy();
	return true;
}


