import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

const dataDir = path.join(__dirname, '..', 'data');
const attachmentsDir = path.join(__dirname, '..', 'attachments');

function ensureDataDir() {
	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true });
	}
	if (!fs.existsSync(attachmentsDir)) {
		fs.mkdirSync(attachmentsDir, { recursive: true });
	}
}

function getArticleFilePath(id) {
	return path.join(dataDir, `${id}.json`);
}

function readAllArticlesMeta() {
	ensureDataDir();
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
}

function readArticleById(id) {
	const filePath = getArticleFilePath(id);
	if (!fs.existsSync(filePath)) return null;
	const raw = fs.readFileSync(filePath, 'utf-8');
	const article = JSON.parse(raw);
	if (!article.attachments) {
		article.attachments = [];
	}
	return article;
}

function saveArticle({ title, content, attachments = [] }) {
	const id = nanoid(12);
	const now = new Date().toISOString();
	const article = { id, title, content, createdAt: now, attachments: attachments || [] };
	fs.writeFileSync(getArticleFilePath(id), JSON.stringify(article, null, 2), 'utf-8');
	return article;
}

function updateArticle(id, { title, content, attachments }) {
	const existing = readArticleById(id);
	if (!existing) return null;
	const updated = { 
		...existing, 
		title, 
		content,
		attachments: attachments !== undefined ? attachments : existing.attachments || []
	};
	fs.writeFileSync(getArticleFilePath(id), JSON.stringify(updated, null, 2), 'utf-8');
	return updated;
}

function deleteArticle(id) {
	const filePath = getArticleFilePath(id);
	if (!fs.existsSync(filePath)) return false;
	fs.unlinkSync(filePath);
	return true;
}

function isHtmlEffectivelyEmpty(html) {
	if (typeof html !== 'string') return true;
	// Remove tags, &nbsp; and whitespace
	const text = html
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return text.length === 0;
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		ensureDataDir();
		cb(null, attachmentsDir);
	},
	filename: (req, file, cb) => {
		const uniqueName = `${nanoid(12)}-${file.originalname}`;
		cb(null, uniqueName);
	}
});

const fileFilter = (req, file, cb) => {
	const allowedMimes = [
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/gif',
		'image/webp',
		'application/pdf'
	];
	if (allowedMimes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error('Only images (JPG, PNG, GIF, WEBP) and PDF files are allowed'), false);
	}
};

const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 10 * 1024 * 1024 }
});

const wss = new WebSocketServer({ server });

const broadcastNotification = (message) => {
	const data = JSON.stringify(message);
	wss.clients.forEach((client) => {
		if (client.readyState === 1) {
			client.send(data);
		}
	});
};

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/api/attachments', express.static(attachmentsDir));

app.get('/health', (_req, res) => {
	res.json({ ok: true });
});

app.get('/api/health', (_req, res) => {
	res.json({ ok: true });
});

app.get('/api/articles', (_req, res) => {
	try {
		const list = readAllArticlesMeta();
		res.json(list);
	} catch (err) {
		res.status(500).json({ error: 'Failed to read articles' });
	}
});

app.get('/api/articles/:id', (req, res) => {
	try {
		const article = readArticleById(req.params.id);
		if (!article) return res.status(404).json({ error: 'Not found' });
		res.json(article);
	} catch (err) {
		res.status(500).json({ error: 'Failed to read article' });
	}
});

app.post('/api/articles', (req, res) => {
	const { title, content } = req.body ?? {};
	if (typeof title !== 'string' || title.trim().length === 0) {
		return res.status(400).json({ error: 'Title is required' });
	}
	if (typeof content !== 'string' || isHtmlEffectivelyEmpty(content)) {
		return res.status(400).json({ error: 'Content is required' });
	}
	try {
		ensureDataDir();
		const created = saveArticle({ title: title.trim(), content, attachments: [] });
		broadcastNotification({
			type: 'article_created',
			articleId: created.id,
			title: created.title,
			message: `New article "${created.title}" was created`
		});
		res.status(201).json(created);
	} catch (err) {
		res.status(500).json({ error: 'Failed to save article' });
	}
});

app.put('/api/articles/:id', (req, res) => {
	const { title, content, attachments } = req.body ?? {};
	if (typeof title !== 'string' || title.trim().length === 0) {
		return res.status(400).json({ error: 'Title is required' });
	}
	if (typeof content !== 'string' || isHtmlEffectivelyEmpty(content)) {
		return res.status(400).json({ error: 'Content is required' });
	}
	try {
		const updated = updateArticle(req.params.id, { 
			title: title.trim(), 
			content,
			attachments: attachments || []
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
		res.status(500).json({ error: 'Failed to update article' });
	}
});

app.delete('/api/articles/:id', (req, res) => {
	try {
		const article = readArticleById(req.params.id);
		const ok = deleteArticle(req.params.id);
		if (!ok) return res.status(404).json({ error: 'Not found' });
		if (article && article.attachments) {
			article.attachments.forEach(att => {
				const filePath = path.join(attachmentsDir, att.filename);
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			});
		}
		res.status(204).send();
	} catch (err) {
		res.status(500).json({ error: 'Failed to delete article' });
	}
});

app.post('/api/articles/:id/attachments', upload.array('files', 10), (req, res) => {
	try {
		const article = readArticleById(req.params.id);
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

		const newAttachments = req.files.map(file => ({
			id: nanoid(12),
			filename: file.filename,
			originalName: file.originalname,
			mimetype: file.mimetype,
			size: file.size,
			uploadedAt: new Date().toISOString()
		}));

		const existingAttachments = article.attachments || [];
		const updatedAttachments = [...existingAttachments, ...newAttachments];
		const updated = updateArticle(req.params.id, {
			title: article.title,
			content: article.content,
			attachments: updatedAttachments
		});

		broadcastNotification({
			type: 'attachment_added',
			articleId: article.id,
			title: article.title,
			attachments: newAttachments,
			message: `${newAttachments.length} file(s) attached to "${article.title}"`
		});

		res.status(201).json({ attachments: newAttachments, article: updated });
	} catch (err) {
		if (req.files) {
			req.files.forEach(file => {
				if (fs.existsSync(file.path)) {
					fs.unlinkSync(file.path);
				}
			});
		}
		if (err.message.includes('Only images')) {
			return res.status(400).json({ error: err.message });
		}
		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({ error: 'File size limit is 10MB. One or more files are too large.' });
		}
		console.error('File upload error:', err);
		res.status(500).json({ error: 'Failed to upload files. Please try again.' });
	}
});

app.delete('/api/articles/:id/attachments/:attachmentId', (req, res) => {
	try {
		const article = readArticleById(req.params.id);
		if (!article) return res.status(404).json({ error: 'Article not found' });

		const attachments = article.attachments || [];
		const attachment = attachments.find(a => a.id === req.params.attachmentId);
		if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

		const filePath = path.join(attachmentsDir, attachment.filename);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}

		const updatedAttachments = attachments.filter(a => a.id !== req.params.attachmentId);
		const updated = updateArticle(req.params.id, {
			title: article.title,
			content: article.content,
			attachments: updatedAttachments
		});

		res.json({ success: true, article: updated });
	} catch (err) {
		res.status(500).json({ error: 'Failed to delete attachment' });
	}
});

server.listen(PORT, () => {
	ensureDataDir();
	console.log(`Server listening on http://localhost:${PORT}`);
	console.log(`WebSocket server ready on ws://localhost:${PORT}`);
});
