import express from 'express';
import * as materialController from '../controllers/material';

const router = express.Router();

router.get('/', materialController.getMaterials);
router.get('/:id', materialController.getMaterialById);
router.post('/', materialController.createMaterial);
router.put('/:id', materialController.updateMaterial);
router.delete('/:id', materialController.deleteMaterial);

export default router;
