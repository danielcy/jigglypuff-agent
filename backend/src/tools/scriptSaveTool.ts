import { BaseTool } from './baseTool';
import type { Creation, Script } from '../types';
import type { AgentContext } from '../agents/types';

/**
 * Save the finalized video script to the creation project.
 * Use this tool when you have finished writing or revising the script and want to save it permanently.
 */
export class ScriptSaveTool extends BaseTool {
  name = 'script_save';
  description = "Save the finalized video script to the creation project. Use this when you've finished writing/revising the script and want to save it permanently.";

  inputSchema = {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Script title' },
      description: { type: 'string', description: 'Brief description of what the script is about' },
      totalDuration: { type: 'number', description: 'Total duration in seconds' },
      scenes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            sceneNo: { type: 'number', description: 'Scene number (starting from 1)' },
            title: { type: 'string', description: 'Scene title/description' },
            duration: { type: 'number', description: 'Duration in seconds' },
            description: { type: 'string', description: 'Detailed description of what happens in this scene' },
            dialogue: { type: 'string', description: 'Dialogue or voiceover text (optional)' },
            bgmSuggestion: { type: 'string', description: 'BGM suggestion (optional)' },
          },
        },
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags describing the script',
      },
    },
    required: ['title', 'description', 'totalDuration', 'scenes'],
  };

  async execute(args: Script, creation: Creation): Promise<{
    script: Script;
    success: boolean;
    message: string;
  }> {
    const { title, description, totalDuration, scenes } = args;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('title is required and must be a non-empty string');
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      throw new Error('description is required and must be a non-empty string');
    }
    if (typeof totalDuration !== 'number' || totalDuration <= 0) {
      throw new Error('totalDuration must be a positive number');
    }
    if (!Array.isArray(scenes) || scenes.length === 0) {
      throw new Error('scenes is required and must be a non-empty array');
    }

    // Save the script to creation - the controller will update it in database
    creation.script = {
      title,
      description,
      totalDuration,
      sceneCount: scenes.length,
      scenes,
      tags: args.tags || [],
      generatedAt: new Date(),
    };

    return {
      script: creation.script,
      success: true,
      message: 'Script saved successfully',
    };
  }
}
