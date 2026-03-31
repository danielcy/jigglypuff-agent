import { Request, Response } from 'express';
import * as materialDao from '../database/materialDao';
import type { LibraryMaterial } from '../types';

export function getMaterials(req: Request, res: Response) {
  try {
    const { categoryId } = req.query;
    let materials: LibraryMaterial[];
    if (categoryId) {
      materials = materialDao.findLibraryMaterialsByCategory(Number(categoryId));
    } else {
      materials = materialDao.findAllLibraryMaterials();
    }
    res.json(materials);
  } catch (error) {
    console.error('[Material] getMaterials failed:', error);
    res.status(500).json({ error: 'Failed to get materials: ' + (error as Error).message });
  }
}

export function getMaterialById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const material = materialDao.findLibraryMaterialById(Number(id));
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    console.error('[Material] getMaterialById failed:', error);
    res.status(500).json({ error: 'Failed to get material: ' + (error as Error).message });
  }
}

export interface CreateMaterialRequest {
  type: 'image' | 'video';
  source: 'manual' | 'hot-search' | 'agent';
  metadata: string;
  name: string;
  description?: string;
  category_id: number;
  tags?: string;
}

export function createMaterial(req: Request, res: Response) {
  try {
    const data = req.body as CreateMaterialRequest;
    if (!data.name || data.name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!data.category_id) {
      return res.status(400).json({ error: 'Category is required' });
    }
    const material = materialDao.createLibraryMaterial({
      ...data,
      name: data.name.trim(),
      description: data.description?.trim(),
    });
    res.status(201).json(material);
  } catch (error) {
    console.error('[Material] createMaterial failed:', error);
    res.status(500).json({ error: 'Failed to create material: ' + (error as Error).message });
  }
}

export interface UpdateMaterialRequest {
  name?: string;
  description?: string;
  category_id?: number;
  tags?: string;
}

export function updateMaterial(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body as UpdateMaterialRequest;
    const material = materialDao.updateLibraryMaterial(Number(id), data);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    console.error('[Material] updateMaterial failed:', error);
    res.status(500).json({ error: 'Failed to update material: ' + (error as Error).message });
  }
}

export function deleteMaterial(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const success = materialDao.deleteLibraryMaterial(Number(id));
    if (!success) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[Material] deleteMaterial failed:', error);
    res.status(500).json({ error: 'Failed to delete material: ' + (error as Error).message });
  }
}
