import { db } from './db';
import type { CreationTool } from '../types';
import { v4 as uuidv4 } from 'uuid';

const defaultTools = [
  { toolName: 'todo_write', enabled: true },
  { toolName: 'video_analyze', enabled: true },
  { toolName: 'file_reader', enabled: true },
  { toolName: 'file_editor', enabled: true },
  { toolName: 'shell', enabled: true },
];

export function getAllTools(): CreationTool[] {
  const rows = db.prepare('SELECT * FROM creation_tools ORDER BY tool_name').all();
  return (rows as any[]).map(rowToCreationTool);
}

export function getToolByName(toolName: string): CreationTool | undefined {
  const row = db.prepare('SELECT * FROM creation_tools WHERE tool_name = ?').get(toolName);
  if (!row) return undefined;
  return rowToCreationTool(row as any);
}

export function updateToolConfig(id: string, updates: Partial<CreationTool>): CreationTool | undefined {
  const existing = db.prepare('SELECT * FROM creation_tools WHERE id = ?').get(id);
  if (!existing) return undefined;

  const fields: string[] = [];
  const params: any[] = [];

  if (updates.enabled !== undefined) {
    fields.push('enabled = ?');
    params.push(updates.enabled);
  }
  if (updates.config !== undefined) {
    fields.push('config = ?');
    params.push(updates.config ? JSON.stringify(updates.config) : null);
  }

  if (fields.length === 0) {
    return rowToCreationTool(existing as any);
  }

  fields.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);

  const sql = `UPDATE creation_tools SET ${fields.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(params);

  return getToolById(id);
}

export function initDefaultTools(): void {
  for (const tool of defaultTools) {
    const existing = getToolByName(tool.toolName);
    if (!existing) {
      const now = new Date();
      const stmt = db.prepare(`
        INSERT INTO creation_tools (id, tool_name, enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(uuidv4(), tool.toolName, tool.enabled ? 1 : 0, now.toISOString(), now.toISOString());
    }
  }
}

function getToolById(id: string): CreationTool | undefined {
  const row = db.prepare('SELECT * FROM creation_tools WHERE id = ?').get(id);
  if (!row) return undefined;
  return rowToCreationTool(row as any);
}

function rowToCreationTool(row: any): CreationTool {
  let config: Record<string, any> | undefined;
  if (row.config) {
    try {
      config = JSON.parse(row.config);
    } catch {
      config = undefined;
    }
  }

  return {
    id: row.id,
    toolName: row.tool_name,
    enabled: Boolean(row.enabled),
    config,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
