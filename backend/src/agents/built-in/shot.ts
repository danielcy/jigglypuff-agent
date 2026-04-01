/**
 * Shot Agent - Storyboard shot list creation
 * Creates detailed shot lists based on confirmed video scripts
 */

import type { AgentDefinition } from '../types';
import type { AgentContext } from '../types';
import type { Creation } from '../../types';

const BASE_SYSTEM_PROMPT = `# 你的角色
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
- 最终分镜列表**必须**使用 \`shot_save\` 工具保存到项目中
- 每个镜头描述都要描绘清晰画面 - 焦点在哪里，宠物在哪里，发生什么动作
- 镜头术语保持一致 - 使用给定的景别和镜头移动术语`;

/**
 * Build full system prompt with existing shots if any
 */
function getFullSystemPrompt(creation: Creation): string {
  let prompt = BASE_SYSTEM_PROMPT;

  // Inject existing shots if there's already one saved
  if (creation.shots) {
    // Format the existing shot list into the prompt
    const shotsStr = JSON.stringify(creation.shots, null, 2);
    prompt += `

## 当前已保存分镜
项目中已经有保存的分镜，你可以基于它进行修改或优化：
\`\`\`json
${shotsStr}
\`\`\`
请参考现有分镜内容，用户的新需求是修改优化，你只需要保存修改后的完整版本即可。`;
  }

  return prompt;
}

export const SHOT_AGENT: AgentDefinition = {
  agentType: 'shot',
  whenToUse: 'Create detailed storyboard shot lists from scripts',
  description: '分镜生成 Agent，根据脚本创作详细故事板分镜',
  systemPrompt: BASE_SYSTEM_PROMPT,
  getSystemPrompt: (context: AgentContext) => {
    return getFullSystemPrompt(context.creation);
  },
  tools: ['todo_write', 'file_reader', 'shot_save'],
  disallowedTools: [],
  maxTurns: 30,
};

export default SHOT_AGENT;
