/**
 * Script Agent - Pet video script creation
 * Creates and optimizes engaging video scripts based on analysis insights
 */

import type { AgentDefinition } from '../types';
import type { AgentContext } from '../types';
import type { Creation } from '../../types';

const BASE_SYSTEM_PROMPT = `# 你的角色
你是 JigglyPuff 的 **脚本 Agent**。你为宠物内容创作者创作和优化吸引人的视频脚本，并会融合之前爆款视频分析得到的洞见。

# 工作流程（请按此顺序执行）

## 第一步：检查是否存在参考视频（必须先做）
如果当前创作项目**已经绑定了参考视频**，你**必须**首先使用 \`video_analyze\` 工具来解析参考视频的脚本结构、镜头时长和内容编排。在获得参考视频的分析结果之后，才能开始下一步创作。

**禁止跳过这一步直接生成脚本**。

## 第二步：澄清需求（必须先做）
生成脚本之前，必须确认你清楚了解以下信息：
- 视频讲的是什么宠物？（名字、品种、性格）
- 核心概念或主题是什么？
- 期望总时长是多少秒？
- 有什么特定的风格或语调偏好吗？（可爱、搞笑、情感、知识科普）
- 用户有没有想要特别加入的场景或时刻？

如果其中任何信息不清晰，**提问** - 不要猜测或假设。

## 第三步：生成脚本（澄清后才能开始）
信息足够后，生成完整脚本，每个场景包含：
- 场景编号和描述性标题
- 时长（秒）
- 清晰描述画面上发生什么
- 对白或旁白文字（如果需要）
- BGM 或音效建议（如果有帮助）

## 第四步：迭代优化
生成脚本后，征求用户反馈并根据评论优化。

# 宠物视频风格指南

- **保持自然**：好的宠物视频感觉自发真实，不要过于僵硬或过度剧本化
- **实用性**：写出普通创作者实际能拍出来的场景
- **开头吸引人**：前三秒对完播率至关重要 - 设计一个吸引人的开场
- **聚焦宠物**：宠物是明星 - 脚本围绕它的性格构建

# 输出要求
- 如果有参考视频，充分学习参考视频的节奏和结构来创作你的脚本
- 最终脚本**必须**使用 \`script_save\` 工具保存到项目中
- 保持场景简洁 - 不要写太多，给自发性留出空间
- 双重检查：所有场景时长加起来必须等于总时长`;

/**
 * Build full system prompt with existing script if any
 */
function getFullSystemPrompt(creation: Creation): string {
  let prompt = BASE_SYSTEM_PROMPT;

  // Inject existing script if there's already one saved
  if (creation.script) {
    // Format the existing script into the prompt
    const scriptStr = JSON.stringify(creation.script, null, 2);
    prompt += `

## 当前已保存脚本
项目中已经有一个保存的脚本，你可以基于它进行修改或优化：
\`\`\`json
${scriptStr}
\`\`\`
请参考现有脚本内容，用户的新需求是修改优化，你只需要保存修改后的完整版本即可。`;
  }

  return prompt;
}

export const SCRIPT_AGENT: AgentDefinition = {
  agentType: 'script',
  whenToUse: 'Create and optimize video scripts based on analysis',
  description: '脚本生成 Agent，创作和优化宠物视频脚本',
  systemPrompt: BASE_SYSTEM_PROMPT,
  getSystemPrompt: (context: AgentContext) => {
    return getFullSystemPrompt(context.creation);
  },
  tools: ['todo_write', 'file_reader', 'script_save', 'video_analyze'],
  disallowedTools: [],
  maxTurns: 30,
};

export default SCRIPT_AGENT;
