import express from 'express';
import * as commentController from '../controllers/commentController.js';
import { validateComment } from '../middleware/validation.js';

const router = express.Router();

router.get('/articles/:id/comments', commentController.getCommentsByArticle);
router.post('/articles/:id/comments', validateComment, commentController.createComment);
router.put('/comments/:id', validateComment, commentController.updateComment);
router.delete('/comments/:id', commentController.deleteComment);

export default router;

