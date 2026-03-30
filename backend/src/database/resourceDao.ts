import { db } from './db';
import type { Resource, ResourceStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function getResourceByPlatformAndItemId(platform: string, itemId: string): Resource | undefined {
  const row = db.prepare('SELECT * FROM resources WHERE platform = ? AND item_id = ?').get(platform, itemId);
  if (!row) return undefined;
  return rowToResource(row as any);
}

export function createResource(platform: string, itemId: string, originalUrl: string): Resource {
  const id = uuidv4();
  const now = new Date();
  const stmt = db.prepare(`
    INSERT INTO resources (id, platform, item_id, original_url, status, download_attempts, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'empty', 0, ?, ?)
  `);
  stmt.run(id, platform, itemId, originalUrl, now.toISOString(), now.toISOString());
  
  return {
    id,
    platform,
    itemId,
    originalUrl,
    status: 'empty',
    downloadAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateResourceStatus(id: string, status: ResourceStatus, error?: string): void {
  const now = new Date();
  let sql = 'UPDATE resources SET status = ?, updated_at = ?';
  const params: any[] = [status, now.toISOString()];
  
  if (error !== undefined) {
    sql += ', error = ?';
    params.push(error);
  }
  
  sql += ' WHERE id = ?';
  params.push(id);
  
  db.prepare(sql).run(params);
}

export function updateResourceAfterDownload(id: string, localPath: string, url: string): void {
  const now = new Date();
  db.prepare('UPDATE resources SET status = ?, local_path = ?, url = ?, updated_at = ? WHERE id = ?')
    .run('done', localPath, url, now.toISOString(), id);
}

export function getAllResources(): Resource[] {
  const rows = db.prepare('SELECT * FROM resources ORDER BY created_at DESC').all();
  return (rows as any[]).map(rowToResource);
}

export function deleteResource(id: string): void {
  db.prepare('DELETE FROM resources WHERE id = ?').run(id);
}

function rowToResource(row: any): Resource {
  return {
    id: row.id,
    platform: row.platform,
    itemId: row.item_id,
    originalUrl: row.original_url,
    status: row.status as ResourceStatus,
    localPath: row.local_path,
    url: row.url,
    downloadAttempts: row.download_attempts,
    error: row.error,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
