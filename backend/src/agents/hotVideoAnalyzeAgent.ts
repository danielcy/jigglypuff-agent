import { BaseAgent } from './baseAgent';
import type { AgentConfig, AgentStepResult } from './baseAgent';
import type { Creation, HotVideoAnalysis, LLMConfig } from '../types';
import toolRegistry from '../tools/toolRegistry';
import { LocalToolClient } from '../tools/localToolClient';

const SYSTEM_PROMPT = `# 你的角色
你是 JigglyPuff 的 **爆款视频分析 Agent**。你的专长是分析 viral 网红宠物视频，提取可操作的洞见，帮助创作者复制成功经验。

# 你的任务
给定一个宠物视频（通过 URL/帧提供），分析它为什么受欢迎，并给出具体建议，帮助用户用自己的宠物创作类似视频。

# 分析框架（四个维度都要覆盖）

将你的分析分解为以下四个维度：

## 1. 为什么受欢迎
分析是什么让这个视频如此吸引人：
- **内容**：核心钩子或情感吸引力是什么？什么样的宠物行为或互动吸引了注意力？
- **风格**：视觉风格、节奏、语调、剪辑节奏是怎样的？
- **话题标签**：视频瞄准了哪些关键词和话题来获得推荐？
- **结构**：视频从钩子 → 内容 → 高潮是如何组织结构的？

## 2. 复制建议
提供具体、可操作的指导：
- **核心概念**：用户应该复制/改编的核心概念是什么？
- **适配调整**：针对用户自己的宠物和风格，需要做哪些调整？
- **关键要点**：要拍出相似效果，用户必须把握好哪些具体元素？

# 输出要求

- 具体，不要模糊 - 用户需要可以立即使用的实用建议
- 如果视频有多个难忘时刻，请分别分析每个时刻
- 这是宠物内容 - 聚焦于是什么让宠物视频与观众建立连接（真实感、可爱、情感、惊喜）
- 最终输出**必须**使用用户指定的 JSON 格式

# 思考过程
逐步思考："是什么让这个视频成功？用户复制它需要知道哪些具体细节？"`;

export class HotVideoAnalyzeAgent extends BaseAgent {
  private creation: Creation;

  constructor(llmConfig: LLMConfig, creation: Creation, onStep?: (step: number, content: string, streaming?: boolean) => void) {
    const availableTools = toolRegistry.getAllTools().filter(t => ['video_analyze', 'file_reader'].includes(t.name)).map(tool => {
      const client = new LocalToolClient(async (toolName: string, args: Record<string, any>) => {
        const foundTool = toolRegistry.getTool(toolName);
        if (!foundTool) {
          throw new Error(`Tool ${toolName} not found`);
        }
        return foundTool.execute(args, creation);
      });
      return {
        client: client as unknown as import('../services/mcpClient').MCPClient,
        tools: [{
          name: tool.name,
          description: tool.description,
          inputSchema: {
            type: 'object',
            properties: {},
          },
        }],
      };
    });

    const config: AgentConfig = {
      llmConfig,
      systemPrompt: SYSTEM_PROMPT,
      availableTools,
      maxSteps: 20,
      onStep,
    };

    super(config);
    this.creation = creation;
  }

  async run(userInput: string): Promise<AgentStepResult> {
    const fullInput = `Current creation: ${this.creation.title}

Analyze this video: ${userInput}

Please provide your analysis in the following JSON format:
{
  "videoUrl": "url of the video",
  "title": "video title",
  "hotReasons": {
    "content": "analysis of why content is popular",
    "style": "analysis of visual/style choices",
    "tags": ["list", "of", "key", "tags"],
    "structure": "analysis of video structure"
  },
  "copyAdvice": {
    "concept": "recommended concept for copying",
    "adjustments": ["list", "of", "suggested", "adjustments"],
    "keyPoints": ["list", "of", "key", "points", "to", "focus", "on"]
  }
}`;

    this.addMessage({
      role: 'user',
      content: fullInput,
    });

    return this.executeLoop();
  }
}
