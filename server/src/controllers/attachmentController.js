import * as attachmentService from '../services/attachmentService.js';
import * as articleService from '../services/articleService.js';
import { broadcastNotification } from '../utils/websocket.js';
import { handleDatabaseError } from '../middleware/errorHandler.js';
import fs from 'fs';
import path from 'path';

export async function uploadAttachments(req, res) {
	try {
		const article = await articleService.readArticleById(req.params.id);
		if (!article) {
			if (req.files) {
				req.files.forEach(file => {
					fs.unlinkSync(file.path);
				});
			}
			return res.status(404).json({ error: 'Article not found' });
		}

		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ error: 'No files uploaded' });
		}

		const result = await attachmentService.createAttachments(req.params.id, req.files);
		if (!result) {
			return res.status(404).json({ error: 'Article not found' });
		}

		const updatedList = await (await import('../config/database.js')).Attachment.findAll({ 
			where: { articleId: req.params.id } 
		});

		broadcastNotification({
			type: 'attachment_added',
			articleId: req.params.id,
			title: result.article.title,
			attachments: result.attachments,
			message: `${result.attachments.length} file(s) attached to "${result.article.title}"`
		});

		res.status(201).json({ 
			attachments: updatedList.map(a => a.toJSON()), 
			article: result.article 
		});
	} catch (err) {
		if (req.files) {
			req.files.forEach(file => {
				if (fs.existsSync(file.path)) {
					fs.unlinkSync(file.path);
				}
			});
		}
		if (err && err.message && err.message.includes('Only images')) {
			return res.status(400).json({ error: err.message });
		}
		if (err && err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({ error: 'File size limit is 10MB. One or more files are too large.' });
		}
		console.error('File upload error:', err);
		res.status(500).json({ error: 'Failed to upload files. Please try again.' });
	}
}

export async function deleteAttachment(req, res) {
	try {
		const result = await attachmentService.deleteAttachment(
			req.params.attachmentId,
			req.params.id
		);
		
		if (!result) return res.status(404).json({ error: 'Attachment not found' });
		
		res.json({ 
			success: true, 
			article: result.article, 
			attachments: result.attachments.map(a => a.toJSON()) 
		});
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to delete attachment');
	}
}

export async function serveAttachment(req, res) {
	try {
		const { filename } = req.params;
		const { Attachment } = await import('../config/database.js');
		
		const attachment = await Attachment.findOne({ where: { filename } });
		if (!attachment) {
			return res.status(404).json({ error: 'Attachment not found' });
		}
		
		const { attachmentsDir } = await import('../config/paths.js');
		const filePath = path.join(attachmentsDir, filename);
		
		if (!fs.existsSync(filePath)) {
			return res.status(404).json({ error: 'File not found' });
		}
		
		res.setHeader('Content-Type', attachment.mimetype);
		res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
		
		const fileStream = fs.createReadStream(filePath);
		fileStream.pipe(res);
	} catch (err) {
		console.error('Error serving attachment:', err);
		res.status(500).json({ error: 'Failed to serve attachment' });
	}
}


