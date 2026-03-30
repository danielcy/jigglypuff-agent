import { db } from './db';
import type { MCPConfig, MCPPlatform, MCPDeployType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function getAllMCPConfigs(): MCPConfig[] {
  const rows = db.prepare('SELECT * FROM mcp_configs ORDER BY created_at DESC').all() as any[];
  return rows.map((row: any) => ({
    id: row.id as string,
    platform: row.platform as MCPPlatform,
    deployType: row.deploy_type as MCPDeployType,
    serverUrl: row.server_url as string,
    cookie: row.cookie as string,
    enabled: Boolean(row.enabled),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string)
  }));
}

export function getMCPConfigById(id: string): MCPConfig | undefined {
  const row: any = db.prepare('SELECT * FROM mcp_configs WHERE id = ?').get(id);
  if (!row) return undefined;
  return {
    id: row.id as string,
    platform: row.platform as MCPPlatform,
    deployType: row.deploy_type as MCPDeployType,
    serverUrl: row.server_url as string,
    cookie: row.cookie as string,
    enabled: Boolean(row.enabled),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string)
  };
}

export function createMCPConfig(config: Omit<MCPConfig, 'id' | 'createdAt' | 'updatedAt'>): MCPConfig {
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO mcp_configs (id, platform, deploy_type, server_url, cookie, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, config.platform, config.deployType, config.serverUrl, config.cookie || null, config.enabled ? 1 : 0, now, now);
  return {
    id,
    ...config,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

export function updateMCPConfig(id: string, config: Partial<MCPConfig>): MCPConfig | undefined {
  const existing = getMCPConfigById(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE mcp_configs
    SET platform = COALESCE(?, platform),
        deploy_type = COALESCE(?, deploy_type),
        server_url = COALESCE(?, server_url),
        cookie = COALESCE(?, cookie),
        enabled = COALESCE(?, enabled),
        updated_at = ?
    WHERE id = ?
  `);
  stmt.run(
    config.platform || null,
    config.deployType || null,
    config.serverUrl || null,
    config.cookie || null,
    config.enabled !== undefined ? (config.enabled ? 1 : 0) : null,
    now,
    id
  );
  return getMCPConfigById(id);
}

export function deleteMCPConfig(id: string): boolean {
  const result = db.prepare('DELETE FROM mcp_configs WHERE id = ?').run(id);
  return result.changes > 0;
}

export function toggleEnabled(id: string, enabled: boolean): boolean {
  const result = db.prepare('UPDATE mcp_configs SET enabled = ?, updated_at = ? WHERE id = ?').run(enabled ? 1 : 0, new Date().toISOString(), id);
  return result.changes > 0;
}

export function getMCPConfigByPlatform(platform: string): MCPConfig | undefined {
  const row: any = db.prepare('SELECT * FROM mcp_configs WHERE platform = ?').get(platform);
  if (!row) return undefined;
  return {
    id: row.id as string,
    platform: row.platform as MCPPlatform,
    deployType: row.deploy_type as MCPDeployType,
    serverUrl: row.server_url as string,
    cookie: row.cookie as string,
    enabled: Boolean(row.enabled),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string)
  };
}
