import { nanoid } from 'nanoid';
import { Attachment, Article } from '../config/database.js';
import { attachmentsDir } from '../config/paths.js';
import path from 'path';
import fs from 'fs';

export async function createAttachments(articleId, files) {
	const article = await Article.findByPk(articleId);
	if (!article) return null;

	const createdAttachments = [];
	for (const file of files) {
		try {
			const att = await Attachment.create({
				id: nanoid(12),
				articleId,
				filename: file.filename,
				originalName: file.originalname,
				mimetype: file.mimetype,
				size: file.size,
				path: `attachments_storage/${file.filename}`,
				uploadedAt: new Date().toISOString()
			});
			createdAttachments.push(att.toJSON());
		} catch (err) {
			console.error('Failed to save attachment to DB:', err && err.message);
		}
	}

	return { article, attachments: createdAttachments };
}

export async function deleteAttachment(attachmentId, articleId) {
	const att = await Attachment.findByPk(attachmentId);
	if (!att || att.articleId !== articleId) return null;

	try {
		const filePath = path.join(attachmentsDir, att.filename);
		if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
	} catch (err) {
		// ignore file removal errors
	}

	await Attachment.destroy({ where: { id: attachmentId } });
	
	const article = await Article.findByPk(articleId);
	const updatedAttachments = await Attachment.findAll({ where: { articleId } });
	
	return { article, attachments: updatedAttachments };
}

