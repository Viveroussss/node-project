import express from 'express';
import * as workspaceController from '../controllers/workspaceController.js';
import { validateWorkspace } from '../middleware/validation.js';

const router = express.Router();

router.get('/', workspaceController.getAllWorkspaces);
router.get('/:id', workspaceController.getWorkspaceById);
router.post('/', validateWorkspace, workspaceController.createWorkspace);
router.put('/:id', validateWorkspace, workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);

export default router;

