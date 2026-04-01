import { BaseTool } from './baseTool';
import type { Creation, LLMConfig } from '../types';

export class VideoAnalyzeTool extends BaseTool {
  name = 'video_analyze';
  description = 'Analyze video frames using multimodal LLM to extract content and hot reasons';

  inputSchema = {
    type: 'object',
    properties: {
      videoUrl: {
        type: 'string',
        description: 'URL of the video frame image to analyze',
      },
      question: {
        type: 'string',
        description: 'The question to ask about the video, what insights to extract',
      },
    },
    required: ['videoUrl', 'question'],
  };

  async execute(args: {
    videoUrl: string;
    question: string;
    llmConfig: LLMConfig;
  }, creation: Creation): Promise<any> {
    const { videoUrl, question, llmConfig } = args;

    const messages = [
      {
        role: 'user' as const,
        content: [
          { type: 'text', text: question },
          { type: 'image_url', image_url: { url: videoUrl } },
        ],
      },
    ];

    const body = {
      model: llmConfig.modelName,
      messages,
      max_tokens: llmConfig.maxTokens ?? 4000,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch(`${llmConfig.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmConfig.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json() as any;
      const content = data.choices[0]?.message?.content || '';

      return {
        videoUrl,
        analysis: content,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
