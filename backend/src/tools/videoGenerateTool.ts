import { BaseTool } from './baseTool';
import type { Creation, CreationProduct } from '../types';
import type { AgentContext } from '../agents/types';
import { getToolConfig } from './utils/getToolConfig';
import * as creationDao from '../database/creationDao';
import { v4 as uuidv4 } from 'uuid';
import { convertAttachmentToBase64 } from '../utils/fileUtils';
import { downloadAndSaveProduct } from '../utils/downloadUtils';

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
      // Volcengine Doubao Seedance API (Ark platform)
      // Reference: https://www.volcengine.com/docs/82379/1366799
      // Build content array with text + optional image
      const content: any[] = [
        { type: 'text', text: prompt }
      ];
      if (imageUrl) {
        let attachment = await convertAttachmentToBase64({type: "image", metadata: {imageUrl}})
        let finalImageUrl = attachment.url
        content.push({
          type: 'image_url',
          image_url: { url: finalImageUrl }
        });
      }

      const submitResponse = await fetch('https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          content,
          duration,
          ratio: "adaptive",
          watermark: false
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

      const taskId = submitData.id;
      console.log(`[VideoGenerateTool] Task submitted: ${taskId}`);

      // Step 2: Poll for result
      // Poll every 5 seconds, timeout after 10 minutes (120 * 5s = 10min)
      const maxRetries = 120;
      for (let retry = 0; retry < maxRetries; retry++) {
        const statusResponse = await fetch(`https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${taskId}`, {
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

        // Status: queued -> processing -> succeeded/failed
        if (statusData.status === 'succeeded') {
          console.log(statusData);
        }
        if (statusData.status === 'succeeded' && statusData.content?.video_url) {
          console.log(`[VideoGenerateTool] Task completed: ${taskId}`);

          // Download video to local storage since Volcengine URLs expire after 24h
          const localUrl = await downloadAndSaveProduct(statusData.content.video_url, 'mp4');
          // Add product to creation
          const newProduct: CreationProduct = {
            id: uuidv4(),
            type: 'video',
            url: localUrl,
            prompt,
            generatedAt: new Date(),
          };
          creationDao.addCreationProduct(creation.id, newProduct);

          return {
            success: true,
            videoUrl: localUrl,
            requestId: taskId,
          };
        }

        if (statusData.status === 'failed') {
          throw new Error('Video generation failed: ' + (statusData.error?.message || 'unknown error'));
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
