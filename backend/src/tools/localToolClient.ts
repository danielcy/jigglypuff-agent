import type { MCPClient } from '../services/mcpClient';

export class LocalToolClient implements Pick<MCPClient, 'callTool'> {
  private toolExecutor: (toolName: string, args: Record<string, any>) => Promise<any>;

  constructor(executor: (toolName: string, args: Record<string, any>) => Promise<any>) {
    this.toolExecutor = executor;
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    return this.toolExecutor(toolName, args);
  }
}
