import { BaseTool } from './baseTool';
import type { Creation } from '../types';
import { forkSubagent } from '../agents/forkSubagent';
import type { AgentContext } from '../agents/types';

/**
 * Fork a sub-agent to perform specialized tasks.
 * Use this when you need to delegate work to a specialized agent:
 * - script: Generate or optimize video script
 * - shot: Generate storyboard shots based on confirmed script
 * - hot_video_analyze: Analyze hot pet videos for inspiration
 */
export class ForkSubagentTool extends BaseTool {
  name = 'fork_subagent';
  description = "Delegate work to a specialized sub-agent. Use this when you need to: (1) script - generate video script; (2) shot - generate storyboard shots; (3) hot_video_analyze - analyze hot pet videos for inspiration.";

  inputSchema = {
    type: 'object',
    properties: {
      agentType: {
        type: 'string',
        enum: ['script', 'shot', 'hot_video_analyze'],
        description: 'Type of specialized agent to fork',
      },
      prompt: {
        type: 'string',
        description: 'The task prompt for the sub-agent, include all necessary context and requirements',
      },
    },
    required: ['agentType', 'prompt'],
  };

  async execute(args: {
    agentType: string;
    prompt: string;
  }, creation: Creation, context: AgentContext): Promise<{
    agentType: string;
    prompt: string;
    success: boolean;
    result: string;
    finalAnswer: string;
  }> {
    const { agentType, prompt } = args;

    if (!agentType || typeof agentType !== 'string') {
      throw new Error('agentType is required and must be a string');
    }
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('prompt is required and must be a string');
    }

    // Fork and run the subagent
    const result = await forkSubagent(context, agentType, prompt);

    if (!result.success || !result.finalAnswer) {
      throw new Error(`Subagent ${agentType} failed: ${result.error || 'empty result'}`);
    }

    return {
      agentType,
      prompt,
      success: true,
      result: result.finalAnswer,
      finalAnswer: result.finalAnswer,
    };
  }
}
