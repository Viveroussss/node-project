import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const dataDir = path.join(__dirname, '..', 'data');

function ensureDataDir() {
	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true });
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
	return JSON.parse(raw);
}

function saveArticle({ title, content }) {
	const id = nanoid(12);
	const now = new Date().toISOString();
	const article = { id, title, content, createdAt: now };
	fs.writeFileSync(getArticleFilePath(id), JSON.stringify(article, null, 2), 'utf-8');
	return article;
}

function updateArticle(id, { title, content }) {
	const existing = readArticleById(id);
	if (!existing) return null;
	const updated = { ...existing, title, content };
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

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

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
		const created = saveArticle({ title: title.trim(), content });
		res.status(201).json(created);
	} catch (err) {
		res.status(500).json({ error: 'Failed to save article' });
	}
});

app.put('/api/articles/:id', (req, res) => {
	const { title, content } = req.body ?? {};
	if (typeof title !== 'string' || title.trim().length === 0) {
		return res.status(400).json({ error: 'Title is required' });
	}
	if (typeof content !== 'string' || isHtmlEffectivelyEmpty(content)) {
		return res.status(400).json({ error: 'Content is required' });
	}
	try {
		const updated = updateArticle(req.params.id, { title: title.trim(), content });
		if (!updated) return res.status(404).json({ error: 'Not found' });
		res.json(updated);
	} catch (err) {
		res.status(500).json({ error: 'Failed to update article' });
	}
});

app.delete('/api/articles/:id', (req, res) => {
	try {
		const ok = deleteArticle(req.params.id);
		if (!ok) return res.status(404).json({ error: 'Not found' });
		res.status(204).send();
	} catch (err) {
		res.status(500).json({ error: 'Failed to delete article' });
	}
});

app.listen(PORT, () => {
	ensureDataDir();
	console.log(`Server listening on http://localhost:${PORT}`);
});
