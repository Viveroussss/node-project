import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createRequire } from 'module';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

const dataDir = path.join(__dirname, '..', 'data');
const attachmentsDir = path.join(__dirname, '..', 'attachments');

const requireC = createRequire(import.meta.url);
const db = requireC(path.join(__dirname, '..', 'models', 'index.cjs'));
const { sequelize, Article } = db;

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
	return Article.findAll({ attributes: ['id', 'title', 'createdAt'], order: [['createdAt', 'DESC']] })
		.then(rows => rows.map(r => ({ id: r.id, title: r.title, createdAt: r.createdAt })))
		.catch(() => {
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
		});
}

function readArticleById(id) {
	return Article.findByPk(id)
		.then(row => {
			if (!row) {
				const filePath = getArticleFilePath(id);
				if (!fs.existsSync(filePath)) return null;
				const raw = fs.readFileSync(filePath, 'utf-8');
				const article = JSON.parse(raw);
				if (!article.attachments) article.attachments = [];
				return article;
			}
			const obj = row.toJSON();
			const filePath = getArticleFilePath(id);
			if (fs.existsSync(filePath)) {
				try {
					const raw = fs.readFileSync(filePath, 'utf-8');
					const json = JSON.parse(raw);
					obj.attachments = json.attachments || [];
				} catch {
					obj.attachments = [];
				}
			} else {
				obj.attachments = [];
			}
			return obj;
		});
}

function saveArticle({ title, content, attachments = [] }) {
	return Article.create({ id: nanoid(12), title, content })
		.then(created => {
			const obj = created.toJSON();
			if (attachments && attachments.length > 0) {
				const fileArticle = { id: obj.id, title: obj.title, content: obj.content, createdAt: obj.createdAt, attachments };
				fs.writeFileSync(getArticleFilePath(obj.id), JSON.stringify(fileArticle, null, 2), 'utf-8');
				obj.attachments = attachments;
			} else {
				obj.attachments = [];
			}
			return obj;
		});
}

function updateArticle(id, { title, content, attachments }) {
	return Article.findByPk(id).then(row => {
		if (!row) return null;
		return row.update({ title, content }).then(updatedRow => {
			const obj = updatedRow.toJSON();
			const filePath = getArticleFilePath(id);
			let fileArticle = { id: obj.id, title: obj.title, content: obj.content, createdAt: obj.createdAt, attachments: [] };
			if (fs.existsSync(filePath)) {
				try { fileArticle = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch {}
			}
			fileArticle.title = obj.title;
			fileArticle.content = obj.content;
			if (attachments !== undefined) fileArticle.attachments = attachments;
			fs.writeFileSync(filePath, JSON.stringify(fileArticle, null, 2), 'utf-8');
			obj.attachments = fileArticle.attachments || [];
			return obj;
		});
	});
}

function deleteArticle(id) {
	return Article.findByPk(id).then(row => {
		if (!row) return false;
		return row.destroy().then(() => {
			const filePath = getArticleFilePath(id);
			if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
			return true;
		});
	});
}

function isHtmlEffectivelyEmpty(html) {
	if (typeof html !== 'string') return true;
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

let wss;

const broadcastNotification = (message) => {
	if (!wss) return;
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

app.get('/api/articles', async (_req, res) => {
    try {
        const list = await readAllArticlesMeta();
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read articles' });
    }
});

app.get('/api/articles/:id', async (req, res) => {
    try {
        const article = await readArticleById(req.params.id);
        if (!article) return res.status(404).json({ error: 'Not found' });
        res.json(article);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read article' });
    }
});

app.post('/api/articles', async (req, res) => {
    const { title, content } = req.body ?? {};
    if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title is required' });
    }
    if (typeof content !== 'string' || isHtmlEffectivelyEmpty(content)) {
        return res.status(400).json({ error: 'Content is required' });
    }
    try {
        ensureDataDir();
        const created = await saveArticle({ title: title.trim(), content, attachments: [] });
        broadcastNotification({
            type: 'article_created',
            articleId: created.id,
            title: created.title,
            message: `New article "${created.title}" was created`
        });
        res.status(201).json(created);
	} catch (err) {
		console.error('POST /api/articles error:', err);
		res.status(500).json({ error: 'Failed to save article' });
	}
});

app.put('/api/articles/:id', async (req, res) => {
    const { title, content, attachments } = req.body ?? {};
    if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title is required' });
    }
    if (typeof content !== 'string' || isHtmlEffectivelyEmpty(content)) {
        return res.status(400).json({ error: 'Content is required' });
    }
    try {
        const updated = await updateArticle(req.params.id, {
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

app.delete('/api/articles/:id', async (req, res) => {
    try {
        const article = await readArticleById(req.params.id);
        const ok = await deleteArticle(req.params.id);
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

app.post('/api/articles/:id/attachments', upload.array('files', 10), async (req, res) => {
	try {
		const article = await readArticleById(req.params.id);
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
		const updated = await updateArticle(req.params.id, {
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
		if (err && err.message && err.message.includes('Only images')) {
			return res.status(400).json({ error: err.message });
		}
		if (err && err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({ error: 'File size limit is 10MB. One or more files are too large.' });
		}
		console.error('File upload error:', err);
		res.status(500).json({ error: 'Failed to upload files. Please try again.' });
	}
});

app.delete('/api/articles/:id/attachments/:attachmentId', async (req, res) => {
	try {
		const article = await readArticleById(req.params.id);
		if (!article) return res.status(404).json({ error: 'Article not found' });

		const attachments = article.attachments || [];
		const attachment = attachments.find(a => a.id === req.params.attachmentId);
		if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

		const filePath = path.join(attachmentsDir, attachment.filename);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}

		const updatedAttachments = attachments.filter(a => a.id !== req.params.attachmentId);
		const updated = await updateArticle(req.params.id, {
			title: article.title,
			content: article.content,
			attachments: updatedAttachments
		});

		res.json({ success: true, article: updated });
	} catch (err) {
		res.status(500).json({ error: 'Failed to delete attachment' });
	}
});

sequelize.authenticate()
	.then(() => {
		console.log('Database connection established');
	})
	.catch((err) => {
		console.warn('Database connection failed (will continue with filesystem fallback):', err.message);
	})
	.finally(() => {
		const maxRetries = 10;
		let attempt = 0;

		function tryListen(port) {
			server.once('error', (err) => {
				if (err && err.code === 'EADDRINUSE' && attempt < maxRetries) {
					console.warn(`Port ${port} in use, trying ${port + 1}...`);
					attempt += 1;
					tryListen(port + 1);
				} else {
					console.error('Server failed to start:', err.message || err);
					process.exit(1);
				}
			});

			server.listen(port, () => {
				ensureDataDir();
					console.log(`Server listening on http://localhost:${port}`);
					try {
						wss = new WebSocketServer({ server });
						wss.on('error', (err) => console.warn('WebSocketServer error:', err && err.message));
						console.log(`WebSocket server ready on ws://localhost:${port}`);
					} catch (err) {
						console.warn('Failed to create WebSocket server:', err && err.message);
					}
			});
		}

		tryListen(PORT);
	});
