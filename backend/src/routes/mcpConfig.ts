import express from 'express';
import * as mcpConfigController from '../controllers/mcpConfig';

const router = express.Router();

router.get('/', mcpConfigController.getAllConfigs);
router.get('/:id', mcpConfigController.getConfigById);
router.post('/', mcpConfigController.createConfig);
router.put('/:id', mcpConfigController.updateConfig);
router.delete('/:id', mcpConfigController.deleteConfig);
router.post('/:id/toggle-enabled', mcpConfigController.toggleEnabled);
router.post('/test', mcpConfigController.testConnection);
router.post('/auto-deploy', mcpConfigController.autoDeploy);
router.post('/:id/start', mcpConfigController.startServer);
router.post('/:id/stop', mcpConfigController.stopServer);
router.post('/list-tools', mcpConfigController.listTools);
router.post('/call-tool', mcpConfigController.callTool);

export default router;
