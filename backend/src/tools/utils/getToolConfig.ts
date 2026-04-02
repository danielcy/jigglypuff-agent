import * as creationToolDao from '../../database/creationToolDao';

/**
 * Get tool configuration from database
 */
export function getToolConfig(toolName: string): { apiKey?: string; model?: string } | undefined {
  const tool = creationToolDao.getToolByName(toolName);
  if (!tool || !tool.enabled || !tool.config) {
    return undefined;
  }
  return tool.config;
}
