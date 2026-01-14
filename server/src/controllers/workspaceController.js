import * as workspaceService from '../services/workspaceService.js';
import { handleDatabaseError } from '../middleware/errorHandler.js';

export async function getAllWorkspaces(req, res) {
	try {
		const workspaces = await workspaceService.getAllWorkspaces();
		res.json(workspaces);
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to read workspaces');
	}
}

export async function getWorkspaceById(req, res) {
	try {
		const workspace = await workspaceService.getWorkspaceById(req.params.id);
		if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
		res.json(workspace);
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to read workspace');
	}
}

export async function createWorkspace(req, res) {
	try {
		const { name, description } = req.body ?? {};
		const workspace = await workspaceService.createWorkspace({ name, description });
		res.status(201).json(workspace);
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to create workspace');
	}
}

export async function updateWorkspace(req, res) {
	try {
		const { name, description } = req.body ?? {};
		const workspace = await workspaceService.updateWorkspace(req.params.id, { name, description });
		if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
		res.json(workspace);
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to update workspace');
	}
}

export async function deleteWorkspace(req, res) {
	try {
		const ok = await workspaceService.deleteWorkspace(req.params.id);
		if (!ok) return res.status(404).json({ error: 'Workspace not found' });
		res.status(204).send();
	} catch (err) {
		handleDatabaseError(err, res, 'Failed to delete workspace');
	}
}


