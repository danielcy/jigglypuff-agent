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
    res.json({
      code: 0,
      message: 'success',
      data: materials,
    });
  } catch (error) {
    console.error('[Material] getMaterials failed:', error);
    res.status(500).json({
      code: 1,
      message: 'Failed to get materials: ' + (error as Error).message,
    });
  }
}

export function getMaterialById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const material = materialDao.findLibraryMaterialById(Number(id));
    if (!material) {
      return res.status(404).json({
        code: 1,
        message: 'Material not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: material,
    });
  } catch (error) {
    console.error('[Material] getMaterialById failed:', error);
    res.status(500).json({
      code: 1,
      message: 'Failed to get material: ' + (error as Error).message,
    });
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
      return res.status(400).json({
        code: 1,
        message: 'Name is required',
      });
    }
    if (!data.category_id) {
      return res.status(400).json({
        code: 1,
        message: 'Category is required',
      });
    }

    let metadata: Record<string, any> = {};
    try {
      metadata = JSON.parse(data.metadata || '{}');
    } catch {
      metadata = {};
    }

    let tags: string[] = [];
    if (data.tags) {
      tags = data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }

    const material = materialDao.createLibraryMaterial({
      type: data.type,
      source: data.source,
      metadata,
      name: data.name.trim(),
      description: data.description?.trim(),
      categoryId: data.category_id,
      tags,
    });
    res.status(201).json({
      code: 0,
      message: 'success',
      data: material,
    });
  } catch (error) {
    console.error('[Material] createMaterial failed:', error);
    res.status(500).json({
      code: 1,
      message: 'Failed to create material: ' + (error as Error).message,
    });
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

    const updateData: {
      name?: string;
      description?: string;
      categoryId?: number;
      tags?: string[];
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }
    if (data.category_id !== undefined) {
      updateData.categoryId = data.category_id;
    }
    if (data.tags !== undefined) {
      updateData.tags = data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }

    const material = materialDao.updateLibraryMaterial(Number(id), updateData);
    if (!material) {
      return res.status(404).json({
        code: 1,
        message: 'Material not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: material,
    });
  } catch (error) {
    console.error('[Material] updateMaterial failed:', error);
    res.status(500).json({
      code: 1,
      message: 'Failed to update material: ' + (error as Error).message,
    });
  }
}

export function deleteMaterial(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const success = materialDao.deleteLibraryMaterial(Number(id));
    if (!success) {
      return res.status(404).json({
        code: 1,
        message: 'Material not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: { success: true },
    });
  } catch (error) {
    console.error('[Material] deleteMaterial failed:', error);
    res.status(500).json({
      code: 1,
      message: 'Failed to delete material: ' + (error as Error).message,
    });
  }
}
