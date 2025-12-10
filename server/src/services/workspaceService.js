import { nanoid } from 'nanoid';
import { Workspace } from '../config/database.js';

export async function getAllWorkspaces() {
	return Workspace.findAll({ order: [['name', 'ASC']] });
}

export async function getWorkspaceById(id) {
	return Workspace.findByPk(id);
}

export async function createWorkspace({ name, description }) {
	return Workspace.create({
		id: nanoid(12),
		name: name.trim(),
		description: description || null
	});
}

export async function updateWorkspace(id, { name, description }) {
	const workspace = await Workspace.findByPk(id);
	if (!workspace) return null;
	await workspace.update({ name: name.trim(), description: description || null });
	return workspace;
}

export async function deleteWorkspace(id) {
	const workspace = await Workspace.findByPk(id);
	if (!workspace) return false;
	await workspace.destroy();
	return true;
}

