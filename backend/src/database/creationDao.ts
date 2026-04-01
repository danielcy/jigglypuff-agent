import { db } from './db';
import type { Creation, CreationTool } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function getAllCreations(): Array<Pick<Creation, 'id' | 'title' | 'status' | 'currentStage' | 'createdAt' | 'updatedAt'>> {
  const rows = db.prepare('SELECT id, title, status, current_stage, created_at, updated_at FROM creations ORDER BY updated_at DESC').all();
  return (rows as any[]).map(rowToCreationList);
}

export function getCreationById(id: string): Creation | undefined {
  const row = db.prepare('SELECT * FROM creations WHERE id = ?').get(id);
  if (!row) return undefined;
  return rowToCreation(row as any);
}

export function createCreation(creation: {
  title: string;
  petIds: string[];
  materialIds: string[];
}): Creation {
  const id = uuidv4();
  const now = new Date();
  const newCreation: Creation = {
    id,
    title: creation.title,
    petIds: creation.petIds,
    materialIds: creation.materialIds,
    status: 'draft',
    currentStage: 'idle',
    plan: [],
    chatHistory: [],
    createdAt: now,
    updatedAt: now,
  };

  const stmt = db.prepare(`
    INSERT INTO creations (
      id, title, pet_ids, material_ids, status, current_stage, content,
      plan, chat_history, analysis_result, script, shots, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    newCreation.id,
    newCreation.title,
    JSON.stringify(newCreation.petIds),
    JSON.stringify(newCreation.materialIds),
    newCreation.status,
    newCreation.currentStage,
    newCreation.content || null,
    JSON.stringify(newCreation.plan),
    JSON.stringify(newCreation.chatHistory),
    newCreation.analysisResult ? JSON.stringify(newCreation.analysisResult) : null,
    newCreation.script ? JSON.stringify(newCreation.script) : null,
    newCreation.shots ? JSON.stringify(newCreation.shots) : null,
    newCreation.createdAt.toISOString(),
    newCreation.updatedAt.toISOString()
  );

  return newCreation;
}

export function updateCreation(id: string, updates: Partial<Creation>): Creation | undefined {
  const existing = getCreationById(id);
  if (!existing) return undefined;

  const updated: Creation = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };

  const fields: string[] = [];
  const params: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    params.push(updated.title);
  }
  if (updates.petIds !== undefined) {
    fields.push('pet_ids = ?');
    params.push(JSON.stringify(updated.petIds));
  }
  if (updates.materialIds !== undefined) {
    fields.push('material_ids = ?');
    params.push(JSON.stringify(updated.materialIds));
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    params.push(updated.status);
  }
  if (updates.currentStage !== undefined) {
    fields.push('current_stage = ?');
    params.push(updated.currentStage);
  }
  if (updates.content !== undefined) {
    fields.push('content = ?');
    params.push(updated.content || null);
  }
  if (updates.plan !== undefined) {
    fields.push('plan = ?');
    params.push(JSON.stringify(updated.plan));
  }
  if (updates.chatHistory !== undefined) {
    fields.push('chat_history = ?');
    params.push(JSON.stringify(updated.chatHistory));
  }
  if (updates.analysisResult !== undefined) {
    fields.push('analysis_result = ?');
    params.push(updated.analysisResult ? JSON.stringify(updated.analysisResult) : null);
  }
  if (updates.script !== undefined) {
    fields.push('script = ?');
    params.push(updated.script ? JSON.stringify(updated.script) : null);
  }
  if (updates.shots !== undefined) {
    fields.push('shots = ?');
    params.push(updated.shots ? JSON.stringify(updated.shots) : null);
  }

  fields.push('updated_at = ?');
  params.push(updated.updatedAt.toISOString());
  params.push(id);

  const sql = `UPDATE creations SET ${fields.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(params);

  return getCreationById(id);
}

export function deleteCreation(id: string): boolean {
  const result = db.prepare('DELETE FROM creations WHERE id = ?').run(id);
  return result.changes > 0;
}

function rowToCreationList(row: any): Pick<Creation, 'id' | 'title' | 'status' | 'currentStage' | 'createdAt' | 'updatedAt'> {
  return {
    id: row.id,
    title: row.title,
    status: row.status as Creation['status'],
    currentStage: row.current_stage as Creation['currentStage'],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToCreation(row: any): Creation {
  let petIds: string[] = [];
  if (row.pet_ids) {
    try {
      petIds = JSON.parse(row.pet_ids);
    } catch {
      petIds = [];
    }
  }

  let materialIds: string[] = [];
  if (row.material_ids) {
    try {
      materialIds = JSON.parse(row.material_ids);
    } catch {
      materialIds = [];
    }
  }

  let plan: any[] = [];
  if (row.plan) {
    try {
      plan = JSON.parse(row.plan);
    } catch {
      plan = [];
    }
  }

  let chatHistory: any[] = [];
  if (row.chat_history) {
    try {
      chatHistory = JSON.parse(row.chat_history);
    } catch {
      chatHistory = [];
    }
  }

  let analysisResult: any = undefined;
  if (row.analysis_result) {
    try {
      analysisResult = JSON.parse(row.analysis_result);
    } catch {
      analysisResult = undefined;
    }
  }

  let script: any = undefined;
  if (row.script) {
    try {
      script = JSON.parse(row.script);
    } catch {
      script = undefined;
    }
  }

  let shots: any = undefined;
  if (row.shots) {
    try {
      shots = JSON.parse(row.shots);
    } catch {
      shots = undefined;
    }
  }

  return {
    id: row.id,
    title: row.title,
    petIds,
    materialIds,
    status: row.status,
    currentStage: row.current_stage,
    content: row.content,
    plan,
    chatHistory,
    analysisResult,
    script,
    shots,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
