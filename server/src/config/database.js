import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const currentFileUrl = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFileUrl);

const requireC = createRequire(import.meta.url);
const db = requireC(path.join(currentDir, '..', '..', 'models', 'index.cjs'));

export const { sequelize, Article, Attachment, Comment, Workspace, ArticleVersion, User } = db;

export async function connectDatabase() {
	try {
		await sequelize.authenticate();
		console.log('Database connection established');
		return true;
	} catch (err) {
		console.warn('Database connection failed (will continue with filesystem fallback):', err.message);
		return false;
	}
}

