import type { Creation } from '../types';
import type { AgentContext } from '../agents/types';

export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };

  abstract execute(args: Record<string, any>, creation: Creation, context?: AgentContext): Promise<any>;
}
