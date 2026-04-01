import { BaseTool } from './baseTool';
import type { Creation, HotVideoAnalysis } from '../types';
import type { AgentContext } from '../agents/types';

/**
 * Save the finalized hot video analysis result to the creation project.
 * Use this tool when you have finished analyzing a hot pet video and want to save the insights permanently.
 */
export class AnalysisSaveTool extends BaseTool {
  name = 'analysis_save';
  description = "Save the finalized hot video analysis result to the creation project. Use this when you've finished analyzing a hot pet video and want to save the insights permanently.";

  inputSchema = {
    type: 'object',
    properties: {
      videoUrl: { type: 'string', description: 'URL of the analyzed video' },
      title: { type: 'string', description: 'Video title' },
      hotReasons: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Why this video is popular - content hook and emotional appeal' },
          style: { type: 'string', description: 'Visual style, pacing, tone analysis' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Keywords/topics that help algorithm discovery',
          },
          structure: { type: 'string', description: 'How the video is structured from hook to climax' },
        },
        required: ['content', 'style', 'tags', 'structure'],
      },
      copyAdvice: {
        type: 'object',
        properties: {
          concept: { type: 'string', description: 'Core concept to copy' },
          adjustments: {
            type: 'array',
            items: { type: 'string' },
            description: 'Adjustments needed to fit user\'s pet',
          },
          keyPoints: {
            type: 'array',
            items: { type: 'string' },
            description: 'Key points to remember for success',
          },
        },
        required: ['concept', 'adjustments', 'keyPoints'],
      },
    },
    required: ['videoUrl', 'title', 'hotReasons', 'copyAdvice'],
  };

  async execute(args: HotVideoAnalysis, creation: Creation): Promise<{
    analysis: HotVideoAnalysis;
    success: boolean;
    message: string;
  }> {
    const { videoUrl, title, hotReasons, copyAdvice } = args;

    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim().length === 0) {
      throw new Error('videoUrl is required and must be a non-empty string');
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('title is required and must be a non-empty string');
    }

    // Save the analysis to creation
    creation.analysisResult = {
      videoUrl,
      title,
      hotReasons,
      copyAdvice,
      analyzedAt: new Date(),
    };

    return {
      analysis: creation.analysisResult,
      success: true,
      message: 'Analysis saved successfully',
    };
  }
}
