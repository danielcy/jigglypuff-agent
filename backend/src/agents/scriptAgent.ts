import { BaseAgent } from './baseAgent';
import type { AgentConfig, AgentStepResult } from './baseAgent';
import type { Creation, Script, LLMConfig } from '../types';
import toolRegistry from '../tools/toolRegistry';
import { LocalToolClient } from '../tools/localToolClient';

const SYSTEM_PROMPT = `# 你的角色
你是 JigglyPuff 的 **脚本 Agent**。你为宠物内容创作者创作和优化吸引人的视频脚本，并会融合之前爆款视频分析得到的洞见。

# 工作流程（请按此顺序执行）

## 第一步：澄清需求（必须先做）
生成脚本之前，必须确认你清楚了解以下信息：
- 视频讲的是什么宠物？（名字、品种、性格）
- 核心概念或主题是什么？
- 期望总时长是多少秒？
- 有什么特定的风格或语调偏好吗？（可爱、搞笑、情感、知识科普）
- 用户有没有想要特别加入的场景或时刻？

如果其中任何信息不清晰，**提问** - 不要猜测或假设。

## 第二步：生成脚本（澄清后才能开始）
信息足够后，生成完整脚本，每个场景包含：
- 场景编号和描述性标题
- 时长（秒）
- 清晰描述画面上发生什么
- 对白或旁白文字（如果需要）
- BGM 或音效建议（如果有帮助）

## 第三步：迭代优化
生成脚本后，征求用户反馈并根据评论优化。

# 宠物视频风格指南

- **保持自然**：好的宠物视频感觉自发真实，不要过于僵硬或过度剧本化
- **实用性**：写出普通创作者实际能拍出来的场景
- **开头吸引人**：前三秒对完播率至关重要 - 设计一个吸引人的开场
- **聚焦宠物**：宠物是明星 - 脚本围绕它的性格构建

# 输出要求
- 最终脚本**必须**使用用户指定的 JSON 格式输出
- 保持场景简洁 - 不要写太多，给自发性留出空间
- 双重检查：所有场景时长加起来必须等于总时长`;

export class ScriptAgent extends BaseAgent {
  private creation: Creation;

  constructor(llmConfig: LLMConfig, creation: Creation, onStep?: (step: number, content: string, streaming?: boolean) => void) {
    const availableTools = toolRegistry.getAllTools().filter(t => ['todo_write', 'file_reader'].includes(t.name)).map(tool => {
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
      maxSteps: 30,
      onStep,
    };

    super(config);
    this.creation = creation;
  }

  async run(userInput: string): Promise<AgentStepResult> {
    let context = '';

    if (this.creation.analysisResult) {
      context += `Previous hot video analysis is available:\n`;
      context += `Video: ${this.creation.analysisResult.title}\n`;
      context += `Hot reasons: ${JSON.stringify(this.creation.analysisResult.hotReasons)}\n`;
      context += `Copy advice: ${JSON.stringify(this.creation.analysisResult.copyAdvice)}\n\n`;
    }

    if (this.creation.script) {
      context += `Current existing script:\n`;
      context += `Title: ${this.creation.script.title}\n`;
      context += `Description: ${this.creation.script.description}\n`;
      context += `Current scenes: ${JSON.stringify(this.creation.script.scenes)}\n\n`;
    }

    const fullInput = `${context}User request: ${userInput}

Please output the final script in this JSON format:
{
  "title": "video title",
  "description": "brief description of the video concept",
  "totalDuration": total duration in seconds,
  "sceneCount": number of scenes,
  "scenes": [
    {
      "id": "unique id",
      "sceneNo": scene number,
      "title": "scene title",
      "duration": duration in seconds,
      "description": "what happens in this scene",
      "dialogue": "dialogue or voiceover text if any",
      "bgmSuggestion": "BGM suggestion if any"
    }
  ],
  "tags": ["list", "of", "tags"],
}`;

    this.addMessage({
      role: 'user',
      content: fullInput,
    });

    return this.executeLoop();
  }
}
