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
const attachmentsDir = path.join(__dirname, '..', '..', 'attachments_storage');

const requireC = createRequire(import.meta.url);
const db = requireC(path.join(__dirname, '..', 'models', 'index.cjs'));
const { sequelize, Article, Attachment, Comment, Workspace } = db;

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

function readAllArticlesMeta(workspaceId = null) {
	const where = workspaceId ? { workspaceId } : {};
	return Article.findAll({ 
		attributes: ['id', 'title', 'createdAt', 'workspaceId'], 
		where,
		order: [['createdAt', 'DESC']] 
	})
		.then(rows => rows.map(r => ({ id: r.id, title: r.title, createdAt: r.createdAt, workspaceId: r.workspaceId })))
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

function saveArticle({ title, content, workspaceId = null, attachments = [] }) {
	return Article.create({ id: nanoid(12), title, content, workspaceId })
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

function updateArticle(id, { title, content, workspaceId, attachments }) {
	return Article.findByPk(id).then(async row => {
		if (!row) return null;
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
		
		return obj;
	});
}

function deleteArticle(id) {
	return Article.findByPk(id).then(async row => {
		if (!row) return false;
		try {
			const atts = await Attachment.findAll({ where: { articleId: id } });
			for (const a of atts) {
				try {
					const filePath = path.join(__dirname, '..', '..', a.path || `attachments_storage/${a.filename}`);
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

app.get('/api/articles', async (req, res) => {
    try {
        const workspaceId = req.query.workspaceId || null;
        const list = await readAllArticlesMeta(workspaceId);
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
    const { title, content, workspaceId } = req.body ?? {};
    if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title is required' });
    }
    if (typeof content !== 'string' || isHtmlEffectivelyEmpty(content)) {
        return res.status(400).json({ error: 'Content is required' });
    }
    try {
        ensureDataDir();
        const created = await saveArticle({ title: title.trim(), content, workspaceId: workspaceId || null, attachments: [] });
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
});

app.put('/api/articles/:id', async (req, res) => {
    const { title, content, workspaceId, attachments } = req.body ?? {};
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
            workspaceId: workspaceId !== undefined ? workspaceId : null,
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

			const createdAttachments = [];
			for (const file of req.files) {
				try {
					const att = await Attachment.create({
						id: nanoid(12),
						articleId: req.params.id,
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

			const updatedList = await Attachment.findAll({ where: { articleId: req.params.id } });
			const updated = await Article.findByPk(req.params.id);

			broadcastNotification({
				type: 'attachment_added',
				articleId: req.params.id,
				title: updated ? updated.title : article.title,
				attachments: createdAttachments,
				message: `${createdAttachments.length} file(s) attached to "${updated ? updated.title : article.title}"`
			});

			res.status(201).json({ attachments: updatedList.map(a => a.toJSON()), article: updated });
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
		const att = await Attachment.findByPk(req.params.attachmentId);
		if (!att || att.articleId !== req.params.id) return res.status(404).json({ error: 'Attachment not found' });
		try {
			const filePath = path.join(__dirname, '..', '..', att.path || `attachments_storage/${att.filename}`);
			if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
		} catch (err) {
			// ignore file removal errors
		}
		await Attachment.destroy({ where: { id: req.params.attachmentId } });

		const updated = await Article.findByPk(req.params.id);
		const updatedAttachments = await Attachment.findAll({ where: { articleId: req.params.id } });
		res.json({ success: true, article: updated, attachments: updatedAttachments.map(a => a.toJSON()) });
	} catch (err) {
		res.status(500).json({ error: 'Failed to delete attachment' });
	}
});

app.get('/api/workspaces', async (_req, res) => {
	try {
		const workspaces = await Workspace.findAll({ order: [['name', 'ASC']] });
		res.json(workspaces);
	} catch (err) {
		console.error('Error fetching workspaces:', err);
		if (err.name === 'SequelizeConnectionError' || err.message?.includes('ECONNREFUSED')) {
			return res.status(503).json({ 
				error: 'Database not available. Please ensure PostgreSQL is running and migrations have been executed.',
				details: 'See DATABASE_SETUP.md for setup instructions'
			});
		}
		res.status(500).json({ error: 'Failed to read workspaces' });
	}
});

app.get('/api/workspaces/:id', async (req, res) => {
	try {
		const workspace = await Workspace.findByPk(req.params.id);
		if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
		res.json(workspace);
	} catch (err) {
		res.status(500).json({ error: 'Failed to read workspace' });
	}
});

app.post('/api/workspaces', async (req, res) => {
	const { name, description } = req.body ?? {};
	if (typeof name !== 'string' || name.trim().length === 0) {
		return res.status(400).json({ error: 'Name is required' });
	}
	try {
		const workspace = await Workspace.create({
			id: nanoid(12),
			name: name.trim(),
			description: description || null
		});
		res.status(201).json(workspace);
	} catch (err) {
		console.error('Error creating workspace:', err);
		if (err.name === 'SequelizeConnectionError' || err.message?.includes('ECONNREFUSED')) {
			return res.status(503).json({ 
				error: 'Database not available. Please ensure PostgreSQL is running and migrations have been executed.',
				details: 'See DATABASE_SETUP.md for setup instructions'
			});
		}
		res.status(500).json({ error: 'Failed to create workspace' });
	}
});

app.put('/api/workspaces/:id', async (req, res) => {
	const { name, description } = req.body ?? {};
	if (typeof name !== 'string' || name.trim().length === 0) {
		return res.status(400).json({ error: 'Name is required' });
	}
	try {
		const workspace = await Workspace.findByPk(req.params.id);
		if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
		await workspace.update({ name: name.trim(), description: description || null });
		res.json(workspace);
	} catch (err) {
		res.status(500).json({ error: 'Failed to update workspace' });
	}
});

app.delete('/api/workspaces/:id', async (req, res) => {
	try {
		const workspace = await Workspace.findByPk(req.params.id);
		if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
		await workspace.destroy();
		res.status(204).send();
	} catch (err) {
		res.status(500).json({ error: 'Failed to delete workspace' });
	}
});

app.get('/api/articles/:id/comments', async (req, res) => {
	try {
		const comments = await Comment.findAll({
			where: { articleId: req.params.id },
			order: [['createdAt', 'ASC']]
		});
		res.json(comments);
	} catch (err) {
		res.status(500).json({ error: 'Failed to read comments' });
	}
});

app.post('/api/articles/:id/comments', async (req, res) => {
	const { content, author } = req.body ?? {};
	if (typeof content !== 'string' || content.trim().length === 0) {
		return res.status(400).json({ error: 'Content is required' });
	}
	try {
		const article = await Article.findByPk(req.params.id);
		if (!article) return res.status(404).json({ error: 'Article not found' });
		
		const comment = await Comment.create({
			id: nanoid(12),
			articleId: req.params.id,
			content: content.trim(),
			author: author && typeof author === 'string' ? author.trim() : 'Anonymous'
		});
		
		broadcastNotification({
			type: 'comment_added',
			articleId: article.id,
			title: article.title,
			message: `New comment added to "${article.title}"`
		});
		
		res.status(201).json(comment);
	} catch (err) {
		console.error('Error creating comment:', err);
		if (err.name === 'SequelizeConnectionError' || err.message?.includes('ECONNREFUSED')) {
			return res.status(503).json({ 
				error: 'Database not available. Please ensure PostgreSQL is running and migrations have been executed.',
				details: 'See DATABASE_SETUP.md for setup instructions'
			});
		}
		res.status(500).json({ error: 'Failed to create comment' });
	}
});

app.put('/api/comments/:id', async (req, res) => {
	const { content } = req.body ?? {};
	if (typeof content !== 'string' || content.trim().length === 0) {
		return res.status(400).json({ error: 'Content is required' });
	}
	try {
		const comment = await Comment.findByPk(req.params.id);
		if (!comment) return res.status(404).json({ error: 'Comment not found' });
		await comment.update({ content: content.trim() });
		res.json(comment);
	} catch (err) {
		res.status(500).json({ error: 'Failed to update comment' });
	}
});

app.delete('/api/comments/:id', async (req, res) => {
	try {
		const comment = await Comment.findByPk(req.params.id);
		if (!comment) return res.status(404).json({ error: 'Comment not found' });
		await comment.destroy();
		res.status(204).send();
	} catch (err) {
		res.status(500).json({ error: 'Failed to delete comment' });
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
