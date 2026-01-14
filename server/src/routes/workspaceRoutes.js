import express from 'express';
import * as workspaceController from '../controllers/workspaceController.js';
import { validateWorkspace } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', workspaceController.getAllWorkspaces);
router.get('/:id', workspaceController.getWorkspaceById);
router.post('/', validateWorkspace, workspaceController.createWorkspace);
router.put('/:id', validateWorkspace, workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);

export default router;


