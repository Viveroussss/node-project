import * as versionService from '../services/versionService.js';
import { handleDatabaseError } from '../middleware/errorHandler.js';

export async function getArticleVersions(req, res) {
	try {
		const { id } = req.params;
		const versions = await versionService.getVersionsByArticleId(id);
		res.json(versions);
	} catch (err) {
		if (err.name === 'SequelizeDatabaseError' || err.message?.includes('does not exist')) {
			return res.json([]);
		}
		handleDatabaseError(err, res, 'Failed to fetch article versions');
	}
}

export async function getArticleVersion(req, res) {
	try {
		const { id, version } = req.params;
		const versionNumber = parseInt(version, 10);
		
		if (isNaN(versionNumber)) {
			return res.status(400).json({ error: 'Invalid version number' });
		}
		
		const versionData = await versionService.getVersionByArticleIdAndVersion(id, versionNumber);
		if (!versionData) {
			return res.status(404).json({ error: 'Version not found' });
		}
		
		res.json(versionData);
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to fetch article version');
	}
}

