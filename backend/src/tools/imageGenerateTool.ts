import { BaseTool } from './baseTool';
import type { Creation, CreationProduct } from '../types';
import type { AgentContext } from '../agents/types';
import { getToolConfig } from './utils/getToolConfig';
import * as creationDao from '../database/creationDao';
import { v4 as uuidv4 } from 'uuid';
import { convertAttachmentToBase64 } from '../utils/fileUtils';
import { downloadAndSaveProduct } from '../utils/downloadUtils';

/**
 * Generate image using Volcengine Seedream (Doubao) API
 * API Doc: https://www.volcengine.com/docs/82379/1824121
 */
export class ImageGenerateTool extends BaseTool {
  name = 'generate_image';
  description = "Generate an image using AI (Volcengine Seedream). Use this when you need to create a visual draft or reference image for the video script. Supports text-to-image and image-to-image with reference image.";

  inputSchema = {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'The prompt describing the image to generate, be specific about style, content, composition',
      },
      imageUrl: {
        type: 'string',
        description: 'Reference image URL for image-to-image or reference style generation. Support local url like uploads/123.jpeg',
      }
    },
    required: ['prompt'],
  };

  async execute(args: {
    prompt: string;
    imageUrl?: string;
    width?: number;
    height?: number;
  }, creation: Creation, context?: AgentContext): Promise<{
    success: boolean;
    imageUrl?: string;
    requestId?: string;
    error?: string;
  }> {
    const { prompt, imageUrl, width = 1024, height = 1024 } = args;

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

    // Convert size to Seedream format: "widthxheight" or use 2K for larger sizes

    let finalImageUrl = null
    if (imageUrl) {
      let attachment = await convertAttachmentToBase64({type: "image", metadata: {imageUrl}})
      finalImageUrl = attachment.url
    }

    try {
      // Volcengine Doubao Seedream API (Ark platform)
      // Reference: https://www.volcengine.com/docs/82379/1824121
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          image: finalImageUrl,
          size: "2K",
          output_format: 'png',
          response_format: 'url',
          watermark: false,
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

      // The API returns images in data array
      // According to Volcengine docs, it should be in data[0].url
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const imageData = data.data[0];
        console.log(`[ImageGenerateTool] Received image data: ${JSON.stringify(data)}`)
        if (imageData.url) {
          // Download image to local storage since Volcengine URLs expire after 24h
          const localUrl = await downloadAndSaveProduct(imageData.url, 'png');
          // Add product to creation
          const newProduct: CreationProduct = {
            id: uuidv4(),
            type: 'image',
            url: localUrl,
            prompt,
            generatedAt: new Date(),
          };
          console.log(`[ImageGenerateTool] Adding product: ${JSON.stringify(newProduct)}. Creation ID: ${creation.id}`)
          creationDao.addCreationProduct(creation.id, newProduct);

          return {
            success: true,
            imageUrl: localUrl,
            requestId: data.created ? String(data.created) : undefined,
          };
        }
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
