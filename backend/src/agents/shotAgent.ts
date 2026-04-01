import { BaseAgent } from './baseAgent';
import type { AgentConfig, AgentStepResult } from './baseAgent';
import type { Creation, ShotList, LLMConfig } from '../types';
import toolRegistry from '../tools/toolRegistry';
import { LocalToolClient } from '../tools/localToolClient';

const SYSTEM_PROMPT = `# 你的角色
你是 JigglyPuff 的 **分镜 Agent**。你根据已确认的视频脚本创作和优化详细的故事板分镜列表。你的描述必须足够清晰，让创作者能够可视化并拍摄每个镜头。

# 工作流程（请按此顺序执行）

## 第一步：确认偏好（必须先做）
生成分镜前，和用户确认以下偏好：
- 想要什么视觉风格？（电影感、vlog、纪录片、社交媒体）
- 对镜头移动有什么偏好吗？（更多动态 vs 更多固定）
- 整体节奏偏好？（快切 vs 慢节奏、更从容的镜头）
- 用户有没有想要特别强调的特定时刻或情感，需要用特定镜头来表现？

如果其中任何信息不清晰，**提问** - 不要猜测。

## 第二步：生成分镜列表（澄清后才能开始）
将确认后的脚本转换为详细分镜列表，每个镜头包含：
- **镜头编号**：从 1 开始顺序编号
- **时长**：单位秒
- **镜头景别**：必须是以下之一：远景 / 全景 / 中景 / 近景 / 特写
- **镜头移动**：必须是以下之一：固定 / 推 / 拉 / 摇 / 移 / 跟 / 环绕
- **画面描述**：详细描述画面中具体有什么（宠物位置、背景、动作）
- **对白/旁白**：这个镜头播放的对白或旁白（如果有）
- **音效**：增强镜头的特定音效建议（如果有）
- **背景音乐**：这个镜头的 BGM 提示（如果有）

## 第三步：迭代优化
生成分镜列表后，征求用户反馈并根据评论优化。

# 好分镜的设计原则

- **清晰优先于创意**：用户必须能根据你的描述想象并拍摄 - 一定要具体
- **节奏匹配内容**：情感时刻用更长镜头，活力时刻用更快剪辑
- **引导视线**：用景别和镜头移动引导观众注意力到重点
- **一镜一意**：不要把太多内容塞进一个镜头
- **总长核对**：反复检查所有镜头总时长是否匹配脚本总时长

# 输出要求
- 最终分镜列表**必须**使用用户指定的 JSON 格式输出
- 每个镜头描述都要描绘清晰画面 - 焦点在哪里，宠物在哪里，发生什么动作
- 镜头术语保持一致 - 使用给定的景别和镜头移动术语`;

export class ShotAgent extends BaseAgent {
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
      context += `Copy advice: ${JSON.stringify(this.creation.analysisResult.copyAdvice)}\n\n`;
    }

    if (this.creation.script) {
      context += `Script that we're working from:\n`;
      context += `Title: ${this.creation.script.title}\n`;
      context += `Description: ${this.creation.script.description}\n`;
      context += `Total duration: ${this.creation.script.totalDuration} seconds\n`;
      context += `Scenes: ${JSON.stringify(this.creation.script.scenes)}\n\n`;
    }

    if (this.creation.shots) {
      context += `Current existing shot list:\n`;
      context += `Total duration: ${this.creation.shots.totalDuration} seconds\n`;
      context += `Shots: ${JSON.stringify(this.creation.shots.shots)}\n\n`;
    }

    const fullInput = `${context}User request: ${userInput}

Please output the final shot list in this JSON format:
{
  "scriptId": "id of the script",
  "totalDuration": total duration in seconds,
  "shots": [
    {
      "id": "unique id",
      "shotNo": shot number starting from 1,
      "duration": duration in seconds,
      "shotSize": "远景" | "全景" | "中景" | "近景" | "特写",
      "cameraMovement": "固定" | "推" | "拉" | "摇" | "移" | "跟" | "环绕",
      "description": "detailed description of the frame",
      "dialogue": "dialogue or voiceover text if any",
      "soundEffect": "sound effect suggestion if any",
      "bgm": "BGM suggestion if any"
    }
  ]
}`;

    this.addMessage({
      role: 'user',
      content: fullInput,
    });

    return this.executeLoop();
  }
}
