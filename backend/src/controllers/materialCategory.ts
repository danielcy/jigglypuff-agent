import { Request, Response } from 'express';
import * as materialCategoryDao from '../database/materialCategoryDao';
import * as materialDao from '../database/materialDao';
import type { MaterialCategory } from '../types';

export function getAllCategories(req: Request, res: Response) {
  try {
    const categories = materialCategoryDao.findAll();
    res.json(categories);
  } catch (error) {
    console.error('[MaterialCategory] getAllCategories failed:', error);
    res.status(500).json({ error: 'Failed to get categories: ' + (error as Error).message });
  }
}

export function getCategoryById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const category = materialCategoryDao.findById(Number(id));
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('[MaterialCategory] getCategoryById failed:', error);
    res.status(500).json({ error: 'Failed to get category: ' + (error as Error).message });
  }
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export function createCategory(req: Request, res: Response) {
  try {
    const { name, description } = req.body as CreateCategoryRequest;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const category = materialCategoryDao.create(name.trim(), description?.trim());
    res.status(201).json(category);
  } catch (error) {
    console.error('[MaterialCategory] createCategory failed:', error);
    res.status(500).json({ error: 'Failed to create category: ' + (error as Error).message });
  }
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}

export function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description } = req.body as UpdateCategoryRequest;
    const categoryId = Number(id);
    const existing = materialCategoryDao.findById(categoryId);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }
    materialCategoryDao.update(
      categoryId,
      name?.trim() || existing.name,
      description
    );
    const updated = materialCategoryDao.findById(categoryId);
    res.json(updated);
  } catch (error) {
    console.error('[MaterialCategory] updateCategory failed:', error);
    res.status(500).json({ error: 'Failed to update category: ' + (error as Error).message });
  }
}

export function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const categoryId = Number(id);
    const existing = materialCategoryDao.findById(categoryId);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const count = materialCategoryDao.countByCategoryId(categoryId);
    if (count > 0) {
      materialDao.deleteLibraryMaterialsByCategoryId(categoryId);
    }
    materialCategoryDao.remove(categoryId);
    res.json({ success: true, deletedCount: count });
  } catch (error) {
    console.error('[MaterialCategory] deleteCategory failed:', error);
    res.status(500).json({ error: 'Failed to delete category: ' + (error as Error).message });
  }
}
