import { db } from './db';
import type { Material, MaterialType, MediaType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function getAllMaterials(): Material[] {
  const rows = db.prepare('SELECT * FROM materials ORDER BY created_at DESC').all();
  return rows.map((row: any) => deserializeMaterial(row));
}

export function searchMaterials(keyword: string, tags?: string[]): Material[] {
  let sql = 'SELECT * FROM materials WHERE 1=1';
  const params: any[] = [];

  if (keyword) {
    sql += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (tags && tags.length > 0) {
    tags.forEach(tag => {
      sql += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    });
  }

  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(params);
  return rows.map((row: any) => deserializeMaterial(row));
}

export function getMaterialById(id: string): Material | undefined {
  const row = db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
  if (!row) return undefined;
  return deserializeMaterial(row);
}

export function createMaterial(material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Material {
  const id = uuidv4();
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(material.tags);
  const stmt = db.prepare(`
    INSERT INTO materials (
      id, title, type, media_type, url, cover_url, tags,
      source_platform, source_original_url, source_author,
      local_path, file_size, description, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    material.title,
    material.type,
    material.mediaType,
    material.url,
    material.coverUrl || null,
    tagsJson,
    material.sourceInfo?.platform || null,
    material.sourceInfo?.originalUrl || null,
    material.sourceInfo?.author || null,
    material.localPath || null,
    material.fileSize || null,
    material.description || null,
    now,
    now
  );

  return {
    id,
    ...material,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

export function updateMaterial(id: string, material: Partial<Material>): Material | undefined {
  const existing = getMaterialById(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();

  const updateFields: string[] = [];
  const params: any[] = [];

  if (material.title) {
    updateFields.push('title = ?');
    params.push(material.title);
  }
  if (material.tags) {
    updateFields.push('tags = ?');
    params.push(JSON.stringify(material.tags));
  }
  if (material.description !== undefined) {
    updateFields.push('description = ?');
    params.push(material.description);
  }
  if (material.coverUrl !== undefined) {
    updateFields.push('cover_url = ?');
    params.push(material.coverUrl);
  }

  updateFields.push('updated_at = ?');
  params.push(now);
  params.push(id);

  const sql = `UPDATE materials SET ${updateFields.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(params);
  return getMaterialById(id);
}

export function deleteMaterial(id: string): boolean {
  const result = db.prepare('DELETE FROM materials WHERE id = ?').run(id);
  return result.changes > 0;
}

function deserializeMaterial(row: any): Material {
  let tags: string[] = [];
  if (row.tags) {
    try {
      tags = JSON.parse(row.tags);
    } catch {
      tags = [];
    }
  }

  return {
    id: row.id as string,
    title: row.title as string,
    type: row.type as MaterialType,
    mediaType: row.media_type as MediaType,
    url: row.url as string,
    coverUrl: row.cover_url as string,
    tags,
    sourceInfo: row.source_platform ? {
      platform: row.source_platform as string,
      originalUrl: row.source_original_url as string,
      author: row.source_author as string
    } : undefined,
    localPath: row.local_path as string,
    fileSize: row.file_size as number,
    description: row.description as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string)
  };
}
