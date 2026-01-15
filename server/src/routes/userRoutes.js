import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', userController.getAllUsers);
router.put('/:userId/role', userController.updateUserRole);

export default router;

