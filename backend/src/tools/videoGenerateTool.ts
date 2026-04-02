import { BaseTool } from './baseTool';
import type { Creation } from '../types';
import type { AgentContext } from '../agents/types';
import { getToolConfig } from './utils/getToolConfig';

/**
 * Generate video using Volcengine Seedance (Doubao) API
 * API Doc: https://www.volcengine.com/docs/82379/1366799
 */
export class VideoGenerateTool extends BaseTool {
  name = 'generate_video';
  description = "Generate a video using AI (Volcengine Seedance). Use this when you need to create a video based on the image and prompt.";

  inputSchema = {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'The text prompt describing the video generation requirements',
      },
      imageUrl: {
        type: 'string',
        description: 'The first frame reference image URL',
      },
      duration: {
        type: 'number',
        description: 'Video duration in seconds, default 5',
      },
      resolution: {
        type: 'string',
        description: 'Video resolution, e.g., "1280x720", default "1024x1024"',
      },
    },
    required: ['prompt'],
  };

  async execute(args: {
    prompt: string;
    imageUrl?: string;
    duration?: number;
    resolution?: string;
  }, creation: Creation, context?: AgentContext): Promise<{
    success: boolean;
    videoUrl?: string;
    requestId?: string;
    error?: string;
  }> {
    const { prompt, imageUrl, duration = 5, resolution = '1024x1024' } = args;

    // Get configuration from creation_tools
    const config = getToolConfig('generate_video');
    if (!config || !config.apiKey) {
      return {
        success: false,
        error: 'Video generation is not configured. Please add API key in settings -> AI Generate.',
      };
    }

    const model = config.model || 'doubao-seedance-1-5-pro-251215';
    const apiKey = config.apiKey as string;

    try {
      // Step 1: Submit async generation task
      // Reference: https://www.volcengine.com/docs/82379/1366799#_2-%E6%8F%90%E4%BA%A4%E8%A7%86%E9%A2%91%E7%94%9F%E6%88%90%E6%B1%82
      const submitResponse = await fetch('https://visual.volcengineapi.com/api/v2/image_to_video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          first_frame_image: imageUrl,
          duration,
          resolution,
        }),
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new Error(`Submit task failed: ${submitResponse.status} ${errorText}`);
      }

      const submitData = await submitResponse.json() as any;

      if (submitData.error) {
        throw new Error(submitData.error.message || submitData.error);
      }

      const taskId = submitData.task_id;
      console.log(`[VideoGenerateTool] Task submitted: ${taskId}`);

      // Step 2: Poll for result
      // Poll every 5 seconds, timeout after 10 minutes (120 * 5s = 10min)
      const maxRetries = 120;
      for (let retry = 0; retry < maxRetries; retry++) {
        const statusResponse = await fetch(`https://visual.volcengineapi.com/api/v2/get_task_result/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.warn(`[VideoGenerateTool] Status check failed: ${errorText}`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        const statusData = await statusResponse.json() as any;

        if (statusData.error) {
          throw new Error(statusData.error.message || statusData.error);
        }

        // Status: 0 = in progress, 1 = success, 2 = failed
        if (statusData.status === 1 && statusData.video?.url) {
          console.log(`[VideoGenerateTool] Task completed: ${taskId}`);
          return {
            success: true,
            videoUrl: statusData.video.url,
            requestId: taskId,
          };
        }

        if (statusData.status === 2) {
          throw new Error('Video generation failed');
        }

        // Still in progress - wait
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      throw new Error('Polling timeout after 10 minutes');
    } catch (error) {
      console.error('[VideoGenerateTool] Error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
