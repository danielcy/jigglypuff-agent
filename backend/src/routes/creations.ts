import express from 'express';
import * as creationsController from '../controllers/creations';

const router = express.Router();

router.get('/', creationsController.listCreations);
router.get('/:id', creationsController.getCreation);
router.post('/', creationsController.createCreation);
router.put('/:id', creationsController.updateCreation);
router.delete('/:id', creationsController.deleteCreation);
router.get('/:id/chat', creationsController.chat);
router.post('/:id/chat', creationsController.chat);
router.post('/:id/tools/execute', creationsController.executeTool);

export default router;
