import express from 'express';
import * as attachmentController from '../controllers/attachmentController.js';
import { upload } from '../config/upload.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/attachments/:filename', attachmentController.serveAttachment);
router.post('/articles/:id/attachments', upload.array('files', 10), attachmentController.uploadAttachments);
router.delete('/articles/:id/attachments/:attachmentId', attachmentController.deleteAttachment);

export default router;


