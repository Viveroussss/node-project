import express from 'express';
import * as articleController from '../controllers/articleController.js';
import * as versionController from '../controllers/versionController.js';
import { validateArticle } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', articleController.getAllArticles);
router.get('/:id/versions', versionController.getArticleVersions);
router.get('/:id/versions/:version', versionController.getArticleVersion);
router.get('/:id', articleController.getArticleById);
router.post('/', validateArticle, articleController.createArticle);
router.put('/:id', validateArticle, articleController.updateArticle);
router.delete('/:id', articleController.deleteArticle);

export default router;

