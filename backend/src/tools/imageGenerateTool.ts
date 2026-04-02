import { BaseTool } from './baseTool';
import type { Creation } from '../types';
import type { AgentContext } from '../agents/types';
import { getToolConfig } from './utils/getToolConfig';

/**
 * Generate image using Volcengine Seedream (Doubao) API
 * API Doc: https://www.volcengine.com/docs/82379/1824121
 */
export class ImageGenerateTool extends BaseTool {
  name = 'generate_image';
  description = "Generate an image using AI (Volcengine Seedream). Use this when you need to create a visual draft or reference image for the video script.";

  inputSchema = {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'The prompt describing the image to generate, be specific about style, content, composition',
      },
      width: {
        type: 'number',
        description: 'Image width in pixels, default 1024',
      },
      height: {
        type: 'number',
        description: 'Image height in pixels, default 1024',
      },
    },
    required: ['prompt'],
  };

  async execute(args: {
    prompt: string;
    width?: number;
    height?: number;
  }, creation: Creation, context?: AgentContext): Promise<{
    success: boolean;
    imageUrl?: string;
    requestId?: string;
    error?: string;
  }> {
    const { prompt, width = 1024, height = 1024 } = args;

    // Get configuration from creation_tools
    const config = getToolConfig('generate_image');
    if (!config || !config.apiKey) {
      return {
        success: false,
        error: 'Image generation is not configured. Please add API key in settings -> AI Generate.',
      };
    }

    const model = config.model || 'doubao-seedream-5-0-260128';
    const apiKey = config.apiKey as string;

    try {
      // Volcengine Doubao Seedream API
      // Reference: https://www.volcengine.com/docs/82379/1824121#_1-%E8%BF%9B%E8%A1%8C%E5%9B%BE%E5%83%8F%E7%94%9F%E6%88%90
      const response = await fetch('https://visual.volcengineapi.com/api/v2/text_to_image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          width,
          height,
          response_image_format: 'png',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json() as any;

      if (data.error) {
        throw new Error(data.error.message || data.error);
      }

      // The API returns image as base64 or URL
      // According to Volcengine docs, it should be in data.image.url
      if (data.image?.url) {
        return {
          success: true,
          imageUrl: data.image.url,
          requestId: data.request_id,
        };
      }

      // If it's base64
      if (data.image?.b64) {
        return {
          success: true,
          imageUrl: `data:image/png;base64,${data.image.b64}`,
          requestId: data.request_id,
        };
      }

      throw new Error('Unexpected API response format');
    } catch (error) {
      console.error('[ImageGenerateTool] Error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
