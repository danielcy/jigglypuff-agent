import { BaseTool } from './baseTool';
import type { Creation, ShotList, Shot } from '../types';
import type { AgentContext } from '../agents/types';

/**
 * Save the finalized storyboard shots to the creation project.
 * Use this tool when you have finished creating or revising the storyboard shots and want to save them permanently.
 */
export class ShotSaveTool extends BaseTool {
  name = 'shot_save';
  description = "Save the finalized storyboard shots to the creation project. Use this when you've finished creating/revising storyboard shots and want to save them permanently.";

  inputSchema = {
    type: 'object',
    properties: {
      scriptId: { type: 'string', description: 'ID of the script this shot list is based on' },
      totalDuration: { type: 'number', description: 'Total duration in seconds' },
      shots: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            shotNo: { type: 'number', description: 'Shot number (starting from 1)' },
            duration: { type: 'number', description: 'Duration in seconds' },
            shotSize: {
              type: 'string',
              enum: ['远景', '全景', '中景', '近景', '特写'],
              description: 'Shot size (must be one of the allowed values)',
            },
            cameraMovement: {
              type: 'string',
              enum: ['固定', '推', '拉', '摇', '移', '跟', '环绕'],
              description: 'Camera movement type (must be one of the allowed values)',
            },
            description: { type: 'string', description: 'Detailed description of what happens in this shot' },
            dialogue: { type: 'string', description: 'Dialogue or voiceover text (optional)' },
            soundEffect: { type: 'string', description: 'Sound effect suggestion (optional)' },
            bgm: { type: 'string', description: 'Background music suggestion (optional)' },
          },
        },
      },
    },
    required: ['scriptId', 'totalDuration', 'shots'],
  };

  async execute(args: ShotList, creation: Creation): Promise<{
    shots: ShotList;
    success: boolean;
    message: string;
  }> {
    const { scriptId, totalDuration, shots } = args;

    if (!scriptId || typeof scriptId !== 'string' || scriptId.trim().length === 0) {
      throw new Error('scriptId is required and must be a non-empty string');
    }
    if (typeof totalDuration !== 'number' || totalDuration <= 0) {
      throw new Error('totalDuration must be a positive number');
    }
    if (!Array.isArray(shots) || shots.length === 0) {
      throw new Error('shots is required and must be a non-empty array');
    }

    // Save the shot list to creation - the controller will update it in database
    creation.shots = {
      scriptId,
      totalDuration,
      shots,
      generatedAt: new Date(),
    };

    return {
      shots: creation.shots,
      success: true,
      message: 'Storyboard shots saved successfully',
    };
  }
}
