import { db } from './db';
import type { MaterialCategory } from '../types';

export function findAll(): MaterialCategory[] {
  const rows = db.prepare('SELECT * FROM material_categories ORDER BY created_at DESC').all();
  return (rows as any[]).map(rowToMaterialCategory);
}

export function findById(id: number): MaterialCategory | undefined {
  const row = db.prepare('SELECT * FROM material_categories WHERE id = ?').get(id);
  if (!row) return undefined;
  return rowToMaterialCategory(row as any);
}

export function create(name: string, description?: string): MaterialCategory {
  const stmt = db.prepare(`
    INSERT INTO material_categories (name, description)
    VALUES (?, ?)
  `);
  const result = stmt.run(name, description || null);
  const id = Number(result.lastInsertRowid);
  return {
    id,
    name,
    description,
    created_at: new Date().toISOString(),
  };
}

export function update(id: number, name: string, description?: string): void {
  db.prepare('UPDATE material_categories SET name = ?, description = ? WHERE id = ?')
    .run(name, description || null, id);
}

export function remove(id: number): void {
  db.prepare('DELETE FROM material_categories WHERE id = ?').run(id);
}

export function countByCategoryId(categoryId: number): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM library_materials WHERE category_id = ?')
    .get(categoryId) as any;
  return Number(result.count);
}

function rowToMaterialCategory(row: any): MaterialCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    created_at: row.created_at,
  };
}
