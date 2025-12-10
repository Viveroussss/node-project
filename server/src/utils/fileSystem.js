import fs from 'fs';
import path from 'path';
import { dataDir, attachmentsDir } from '../config/paths.js';

export function ensureDataDir() {
	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true });
	}
	if (!fs.existsSync(attachmentsDir)) {
		fs.mkdirSync(attachmentsDir, { recursive: true });
	}
}

export function getArticleFilePath(id) {
	return path.join(dataDir, `${id}.json`);
}

