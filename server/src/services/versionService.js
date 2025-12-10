import { nanoid } from 'nanoid';
import { ArticleVersion } from '../config/database.js';

export async function getNextVersionNumber(articleId) {
	try {
		const maxVersion = await ArticleVersion.findOne({
			where: { articleId },
			attributes: ['versionNumber'],
			order: [['versionNumber', 'DESC']]
		});
		
		return maxVersion ? maxVersion.versionNumber + 1 : 1;
	} catch (err) {
		if (err.name === 'SequelizeDatabaseError' || err.message?.includes('does not exist')) {
			return 1;
		}
		throw err;
	}
}

export async function createVersion(articleId, { title, content, workspaceId }) {
	try {
		const versionNumber = await getNextVersionNumber(articleId);
		
		const version = await ArticleVersion.create({
			id: nanoid(12),
			articleId,
			versionNumber,
			title,
			content,
			workspaceId
		});
		
		console.log(`Created version ${versionNumber} for article ${articleId}`);
		return version;
	} catch (err) {
		if (err.name === 'SequelizeDatabaseError' || err.message?.includes('does not exist') || err.message?.includes('relation') && err.message?.includes('does not exist')) {
			console.warn('ArticleVersion table does not exist. Skipping version creation. Run migrations to enable versioning.');
			return null;
		}
		console.error('Error creating article version:', err);
		return null;
	}
}

export async function getVersionsByArticleId(articleId) {
	try {
		return await ArticleVersion.findAll({
			where: { articleId },
			order: [['versionNumber', 'DESC']],
			attributes: ['id', 'articleId', 'versionNumber', 'title', 'createdAt', 'workspaceId']
		});
	} catch (err) {
		if (err.name === 'SequelizeDatabaseError' || err.message?.includes('does not exist')) {
			return [];
		}
		throw err;
	}
}

export async function getVersionByArticleIdAndVersion(articleId, versionNumber) {
	try {
		return await ArticleVersion.findOne({
			where: { articleId, versionNumber }
		});
	} catch (err) {
		if (err.name === 'SequelizeDatabaseError' || err.message?.includes('does not exist')) {
			return null;
		}
		throw err;
	}
}

