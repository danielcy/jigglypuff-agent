import express from 'express';
import * as resourceController from '../controllers/resource';

const router = express.Router();

router.post('/get-or-create', resourceController.getOrCreateResource);
router.get('/:platform/:itemId/status', resourceController.getResourceStatus);
router.post('/retry', resourceController.retryDownload);
router.get('/', resourceController.getAllResources);
router.delete('/:id', resourceController.deleteResource);

export default router;
