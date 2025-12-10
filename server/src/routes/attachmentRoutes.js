import express from 'express';
import * as attachmentController from '../controllers/attachmentController.js';
import { upload } from '../config/upload.js';

const router = express.Router();

router.post('/articles/:id/attachments', upload.array('files', 10), attachmentController.uploadAttachments);
router.delete('/articles/:id/attachments/:attachmentId', attachmentController.deleteAttachment);

export default router;

