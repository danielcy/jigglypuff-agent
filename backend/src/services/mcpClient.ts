import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHTTP.js';
import type { Tool, ToolInputSchema } from '../types';

export interface MCPClientConfig {
  serverUrl: string;
}

export class MCPClient {
  private serverUrl: string;
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  private connected: boolean = false;

  constructor(config: MCPClientConfig) {
    this.serverUrl = config.serverUrl.replace(/\/$/, '');
    this.client = new Client({
      name: 'jigglypuff-mcp-client',
      version: '1.0.0',
    });
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    
    this.transport = new StreamableHTTPClientTransport(new URL(this.serverUrl));
    await this.client!.connect(this.transport);
    this.connected = true;
  }

  async listTools(): Promise<{ tools: Tool[] }> {
    await this.connect();
    const result = await this.client!.listTools();
    return {
      tools: result.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as ToolInputSchema,
      })),
    };
  }

  async callTool(name: string, parameters: Record<string, any>): Promise<{ content: any; isError?: boolean }> {
    await this.connect();
    const result = await this.client!.callTool({
      name,
      arguments: parameters,
    });
    return {
      content: result.content,
      isError: result.isError as boolean | undefined,
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.listTools();
      return { success: true, message: '连接成功' };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async disconnect(): Promise<void> {
    if (this.transport && this.connected) {
      await this.transport.close();
      this.connected = false;
      this.client = null;
      this.transport = null;
    }
  }
}
