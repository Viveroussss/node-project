import * as articleService from '../services/articleService.js';
import { broadcastNotification } from '../utils/websocket.js';
import { handleDatabaseError } from '../middleware/errorHandler.js';
import { ensureDataDir } from '../utils/fileSystem.js';

export async function getAllArticles(req, res) {
	try {
		const workspaceId = req.query.workspaceId || null;
		const list = await articleService.readAllArticlesMeta(workspaceId);
		res.json(list);
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to read articles');
	}
}

export async function getArticleById(req, res) {
	try {
		const versionNumber = req.query.version ? parseInt(req.query.version, 10) : null;
		if (versionNumber !== null && isNaN(versionNumber)) {
			return res.status(400).json({ error: 'Invalid version number' });
		}
		
		const article = await articleService.readArticleById(req.params.id, versionNumber);
		if (!article) return res.status(404).json({ error: 'Not found' });
		res.json(article);
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to read article');
	}
}

export async function createArticle(req, res) {
	try {
		const { title, content, workspaceId } = req.body ?? {};
		ensureDataDir();
		const created = await articleService.saveArticle({ 
			title: title.trim(), 
			content, 
			workspaceId: workspaceId || null 
		});
		
		broadcastNotification({
			type: 'article_created',
			articleId: created.id,
			title: created.title,
			message: `New article "${created.title}" was created`
		});
		
		res.status(201).json(created);
	} catch (err) {
		console.error('POST /api/articles error:', err);
		const errorMessage = err.message && err.message.includes('Database connection failed')
			? err.message
			: 'Failed to save article. Please check database connection.';
		res.status(500).json({ error: errorMessage });
	}
}

export async function updateArticle(req, res) {
	try {
		const { title, content, workspaceId } = req.body ?? {};
		const updated = await articleService.updateArticle(req.params.id, {
			title: title.trim(),
			content,
			workspaceId: workspaceId !== undefined ? workspaceId : null
		});
		
		if (!updated) return res.status(404).json({ error: 'Not found' });
		
		broadcastNotification({
			type: 'article_updated',
			articleId: updated.id,
			title: updated.title,
			message: `Article "${updated.title}" was updated`
		});
		
		res.json(updated);
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to update article');
	}
}

export async function deleteArticle(req, res) {
	try {
		const article = await articleService.readArticleById(req.params.id);
		const ok = await articleService.deleteArticle(req.params.id);
		if (!ok) return res.status(404).json({ error: 'Not found' });
		
		if (article && article.attachments) {
			const { attachmentsDir } = await import('../config/paths.js');
			const pathModule = await import('path');
			const fs = await import('fs');
			article.attachments.forEach(att => {
				const filePath = pathModule.join(attachmentsDir, att.filename);
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			});
		}
		
		res.status(204).send();
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to delete article');
	}
}

