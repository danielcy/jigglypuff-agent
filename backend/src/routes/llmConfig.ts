import express from 'express';
import * as llmConfigController from '../controllers/llmConfig';

const router = express.Router();

router.get('/', llmConfigController.getAllConfigs);
router.get('/default', llmConfigController.getDefaultConfig);
router.get('/:id', llmConfigController.getConfigById);
router.post('/', llmConfigController.createConfig);
router.put('/:id', llmConfigController.updateConfig);
router.delete('/:id', llmConfigController.deleteConfig);
router.post('/:id/set-default', llmConfigController.setDefault);
router.post('/test', llmConfigController.testConnection);

export default router;
