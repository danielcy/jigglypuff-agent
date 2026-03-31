import express from 'express';
import * as materialCategoryController from '../controllers/materialCategory';

const router = express.Router();

router.get('/', materialCategoryController.getAllCategories);
router.get('/:id', materialCategoryController.getCategoryById);
router.post('/', materialCategoryController.createCategory);
router.put('/:id', materialCategoryController.updateCategory);
router.delete('/:id', materialCategoryController.deleteCategory);

export default router;
