import { nanoid } from 'nanoid';
import { Article, Attachment, Comment } from '../config/database.js';
import { getArticleFilePath } from '../utils/fileSystem.js';
import * as versionService from './versionService.js';
import fs from 'fs';
import path from 'path';
import { attachmentsDir, dataDir } from '../config/paths.js';

export async function readAllArticlesMeta(workspaceId = null) {
	const where = workspaceId ? { workspaceId } : {};
	return Article.findAll({ 
		attributes: ['id', 'title', 'createdAt', 'workspaceId', 'userId'], 
		where,
		order: [['createdAt', 'DESC']] 
	})
		.then(rows => rows.map(r => ({ 
			id: r.id, 
			title: r.title, 
			createdAt: r.createdAt, 
			workspaceId: r.workspaceId,
			userId: r.userId
		})))
		.catch(() => {
			if (!fs.existsSync(dataDir)) return [];
			const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
			const metas = [];
			for (const file of files) {
				try {
					const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8');
					const json = JSON.parse(raw);
					metas.push({ id: json.id, title: json.title, createdAt: json.createdAt });
				} catch {
					continue;
				}
			}
			metas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
			return metas;
		});
}

export async function readArticleById(id, versionNumber = null) {
	if (versionNumber !== null) {
		const versionData = await versionService.getVersionByArticleIdAndVersion(id, versionNumber).catch(() => null);
		if (!versionData) return null;
		
		const article = await Article.findByPk(id);
		if (!article) return null;
		
		const obj = versionData.toJSON();
		obj.articleId = id;
		obj.isVersion = true;
		obj.versionNumber = versionNumber;
		
		const atts = await Attachment.findAll({ where: { articleId: id } }).catch(() => []);
		obj.attachments = atts.map(a => ({
			id: a.id,
			filename: a.filename,
			originalName: a.originalName,
			mimetype: a.mimetype,
			size: a.size,
			uploadedAt: a.uploadedAt,
			path: a.path
		}));
		
		const comments = await Comment.findAll({ 
			where: { articleId: id },
			order: [['createdAt', 'ASC']]
		}).catch(() => []);
		obj.comments = comments.map(c => ({
			id: c.id,
			content: c.content,
			author: c.author,
			createdAt: c.createdAt,
			updatedAt: c.updatedAt
		}));
		
		return obj;
	}
	
	return Article.findByPk(id)
		.then(async row => {
			if (!row) {
				const filePath = getArticleFilePath(id);
				if (!fs.existsSync(filePath)) return null;
				const raw = fs.readFileSync(filePath, 'utf-8');
				const article = JSON.parse(raw);
				if (!article.attachments) article.attachments = [];
				if (!article.comments) article.comments = [];
				return article;
			}
			const obj = row.toJSON();
			obj.isVersion = false;
			
			const versions = await versionService.getVersionsByArticleId(id).catch(() => []);
			obj.versionCount = versions.length;
			obj.currentVersion = versions.length > 0 ? versions.length + 1 : 1;
			
			const atts = await Attachment.findAll({ where: { articleId: id } }).catch(() => []);
			obj.attachments = atts.map(a => ({
				id: a.id,
				filename: a.filename,
				originalName: a.originalName,
				mimetype: a.mimetype,
				size: a.size,
				uploadedAt: a.uploadedAt,
				path: a.path
			}));
			
			const comments = await Comment.findAll({ 
				where: { articleId: id },
				order: [['createdAt', 'ASC']]
			}).catch(() => []);
			obj.comments = comments.map(c => ({
				id: c.id,
				content: c.content,
				author: c.author,
				createdAt: c.createdAt,
				updatedAt: c.updatedAt
			}));
			
			return obj;
		});
}

export async function saveArticle({ title, content, workspaceId = null, userId = null }) {
	return Article.create({ id: nanoid(12), title, content, workspaceId, userId })
		.then(created => {
			const obj = created.toJSON();
			obj.attachments = [];
			obj.comments = [];
			return obj;
		})
		.catch(err => {
			console.error('Database error in saveArticle:', err);
			throw new Error('Database connection failed. Please ensure PostgreSQL is running and migrations have been executed.');
		});
}

export async function updateArticle(id, { title, content, workspaceId }) {
	return Article.findByPk(id).then(async row => {
		if (!row) return null;
		
		try {
			await versionService.createVersion(id, {
				title: row.title,
				content: row.content,
				workspaceId: row.workspaceId
			});
		} catch (err) {
			console.error('Failed to create version before update:', err);
		}
		
		const updateData = { title, content };
		if (workspaceId !== undefined) updateData.workspaceId = workspaceId;
		
		const updatedRow = await row.update(updateData);
		const obj = updatedRow.toJSON();
		
		const atts = await Attachment.findAll({ where: { articleId: id } }).catch(() => []);
		obj.attachments = atts.map(a => ({
			id: a.id,
			filename: a.filename,
			originalName: a.originalName,
			mimetype: a.mimetype,
			size: a.size,
			uploadedAt: a.uploadedAt,
			path: a.path
		}));
		
		const comments = await Comment.findAll({ 
			where: { articleId: id },
			order: [['createdAt', 'ASC']]
		}).catch(() => []);
		obj.comments = comments.map(c => ({
			id: c.id,
			content: c.content,
			author: c.author,
			createdAt: c.createdAt,
			updatedAt: c.updatedAt
		}));
		
		const versions = await versionService.getVersionsByArticleId(id).catch(() => []);
		obj.versionCount = versions.length;
		obj.currentVersion = versions.length > 0 ? versions.length + 1 : 1;
		
		return obj;
	});
}

export async function deleteArticle(id) {
	return Article.findByPk(id).then(async row => {
		if (!row) return false;
		try {
			const atts = await Attachment.findAll({ where: { articleId: id } });
			for (const a of atts) {
				try {
					const filePath = path.join(attachmentsDir, a.filename);
					if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
				} catch (err) {
					// ignore
				}
			}
			await Attachment.destroy({ where: { articleId: id } });
		} catch (err) {
			// ignore attachment cleanup errors
		}

		await row.destroy();
		const filePath = getArticleFilePath(id);
		if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
		return true;
	});
}

