/**
 * Hot Video Analyze Agent - Viral pet video analysis
 * Analyzes why popular pet videos go viral and provides actionable advice
 */

import type { AgentDefinition } from '../types';
import type { AgentContext } from '../types';
import type { Creation } from '../../types';

const BASE_SYSTEM_PROMPT = `# 你的角色
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
- 最终分析结果**必须**使用 \`analysis_save\` 工具保存到项目中

# 思考过程
逐步思考："是什么让这个视频成功？用户复制它需要知道哪些具体细节？"`;

/**
 * Build full system prompt with existing analysis if any
 */
function getFullSystemPrompt(creation: Creation): string {
  let prompt = BASE_SYSTEM_PROMPT;

  // Inject existing analysis if there's already one saved
  if (creation.analysisResult) {
    // Format the existing analysis into the prompt
    const analysisStr = JSON.stringify(creation.analysisResult, null, 2);
    prompt += `

## 当前已保存分析
项目中已经有一份分析结果，用户可能想要补充或修改它：
\`\`\`json
${analysisStr}
\`\`\`
请参考已有分析，根据用户新需求进行调整修改。`;
  }

  return prompt;
}

export const HOT_VIDEO_ANALYZE_AGENT: AgentDefinition = {
  agentType: 'hot_video_analyze',
  whenToUse: 'Analyze viral pet videos to extract insights for copying',
  description: '爆款视频分析 Agent，分析为什么宠物视频受欢迎并提供复制建议',
  systemPrompt: BASE_SYSTEM_PROMPT,
  getSystemPrompt: (context: AgentContext) => {
    return getFullSystemPrompt(context.creation);
  },
  tools: ['video_analyze', 'file_reader', 'analysis_save'],
  disallowedTools: [],
  maxTurns: 20,
};

export default HOT_VIDEO_ANALYZE_AGENT;
