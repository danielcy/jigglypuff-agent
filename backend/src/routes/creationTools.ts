import express from 'express';
import * as creationToolsController from '../controllers/creationTools';

const router = express.Router();

router.get('/', creationToolsController.listTools);
router.put('/:id', creationToolsController.updateTool);

export default router;
