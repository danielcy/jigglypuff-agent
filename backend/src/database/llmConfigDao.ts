import { db } from './db';
import type { LLMConfig, LLMProvider } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function getAllLLMConfigs(): LLMConfig[] {
  const rows = db.prepare('SELECT * FROM llm_configs ORDER BY created_at DESC').all() as any[];
  return rows.map((row: any) => ({
    id: row.id as string,
    provider: row.provider as LLMProvider,
    baseUrl: row.base_url as string,
    apiKey: row.api_key as string,
    modelName: row.model_name as string,
    maxTokens: row.max_tokens ? Number(row.max_tokens) : undefined,
    isDefault: Boolean(row.is_default),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string)
  }));
}

export function getDefaultLLMConfig(): LLMConfig | undefined {
  const row: any = db.prepare('SELECT * FROM llm_configs WHERE is_default = 1').get();
  if (!row) return undefined;
  return {
    id: row.id as string,
    provider: row.provider as LLMProvider,
    baseUrl: row.base_url as string,
    apiKey: row.api_key as string,
    modelName: row.model_name as string,
    maxTokens: row.max_tokens ? Number(row.max_tokens) : undefined,
    isDefault: Boolean(row.is_default),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string)
  };
}

export function getLLMConfigById(id: string): LLMConfig | undefined {
  const row: any = db.prepare('SELECT * FROM llm_configs WHERE id = ?').get(id);
  if (!row) return undefined;
  return {
    id: row.id as string,
    provider: row.provider as LLMProvider,
    baseUrl: row.base_url as string,
    apiKey: row.api_key as string,
    modelName: row.model_name as string,
    maxTokens: row.max_tokens ? Number(row.max_tokens) : undefined,
    isDefault: Boolean(row.is_default),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string)
  };
}

export function createLLMConfig(config: Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt'>): LLMConfig {
  const id = uuidv4();
  const now = new Date().toISOString();
  const maxTokens = config.maxTokens ?? 32000;

  if (config.isDefault) {
    db.prepare('UPDATE llm_configs SET is_default = 0').run();
  }

  const stmt = db.prepare(`
    INSERT INTO llm_configs (id, provider, base_url, api_key, model_name, max_tokens, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, config.provider, config.baseUrl, config.apiKey, config.modelName, maxTokens, config.isDefault ? 1 : 0, now, now);
  return {
    id,
    ...config,
    maxTokens,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

export function updateLLMConfig(id: string, config: Partial<LLMConfig>): LLMConfig | undefined {
  const existing = getLLMConfigById(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();

  if (config.isDefault) {
    db.prepare('UPDATE llm_configs SET is_default = 0').run();
  }

  const stmt = db.prepare(`
    UPDATE llm_configs
    SET provider = COALESCE(?, provider),
        base_url = COALESCE(?, base_url),
        api_key = COALESCE(?, api_key),
        model_name = COALESCE(?, model_name),
        max_tokens = COALESCE(?, max_tokens),
        is_default = COALESCE(?, is_default),
        updated_at = ?
    WHERE id = ?
  `);
  stmt.run(
    config.provider || null,
    config.baseUrl || null,
    config.apiKey || null,
    config.modelName || null,
    config.maxTokens !== undefined ? config.maxTokens : null,
    config.isDefault !== undefined ? (config.isDefault ? 1 : 0) : null,
    now,
    id
  );
  return getLLMConfigById(id);
}

export function deleteLLMConfig(id: string): boolean {
  const result = db.prepare('DELETE FROM llm_configs WHERE id = ?').run(id);
  return result.changes > 0;
}

export function setDefaultLLMConfig(id: string): boolean {
  db.prepare('UPDATE llm_configs SET is_default = 0').run();
  const result = db.prepare('UPDATE llm_configs SET is_default = 1 WHERE id = ?').run(id);
  return result.changes > 0;
}
