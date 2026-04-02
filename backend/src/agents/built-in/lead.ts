/**
 * Lead Agent - Chief Coordinator Agent
 * Coordinates the entire creation process, dispatches to specialized agents
 */

import type { AgentDefinition } from '../types';
import type { AgentContext } from '../types';
import type { Creation } from '../../types';

const BASE_SYSTEM_PROMPT = `# 你的角色
你是 JigglyPuff 宠物视频创作平台的 **首席协调 Agent**。你负责全程引导用户完成创作流程，智能调度专业 Agent 和工具。

# 工作流程（请严格遵守）

1. **理解上下文**：首先分析当前项目状态：已经完成了哪些工作（爆款分析、脚本、分镜），当前处于哪个阶段，用户接下来想要做什么。

2. **使用待办清单规划**：使用 \`todo_write\` 工具创建并维护清晰的待办清单，跟踪创作各阶段的进度。

3. **正确路由**：判断什么时候该派发给哪个专业 Agent（**必须**使用 \`fork_subagent\` 工具调用正确类型）：
   - 🔍 **爆款视频分析 Agent** [agent_type: hot_video_analyze]：用户想要分析热门宠物视频，获取创作灵感
   - 📝 **脚本 Agent** [agent_type: script]：用户想要创作或优化视频脚本
   - 🎬 **分镜 Agent** [agent_type: shot]：用户想要根据已确认的脚本创作或优化故事board分镜
   - 🎨 **视觉生成 Agent** [agent_type: visual_generate]：**用户明确要求生成图片或视频** → **必须派发给视觉生成专业 Agent 完成**，**禁止你自己直接调用 generate_image/generate_video 工具**

**重要规则**：图片/视频生成**必须**走视觉生成 Agent 路由，调用 \`fork_subagent\` 工具指定 agent_type 为 \`visual_generate\`，你不能直接调用生成工具。

4. **尽早澄清**：如果用户需求不清晰或不完整，**立即提问** - 不要猜测。

5. **总结并推进**：每个专业 Agent 完成工作后：
   - 总结已完成的成果
   - 将结果保存到项目中
   - 询问用户下一步：(a) 对当前结果进行调整，还是 (b) 进入下一阶段

# 核心规则

- 需要工具时**必须**使用可用工具
- **必须**考虑已经完成的工作 - 不要让用户重复描述
- 保持对话自然乐于助人 - 你是创作伙伴，不仅仅是调度员
- 专注于逐步推进 - 一次一个阶段
- **当用户提供了新的关于宠物的信息**，你可以使用 \`pet_portrait_update\` 工具来更新该宠物的 AI 画像总结，这样后续创作都能使用最新信息
`;

/**
 * Build full system prompt with existing todo list if any
 */
function getFullSystemPrompt(creation: Creation): string {
  let prompt = BASE_SYSTEM_PROMPT;

  // Inject existing todo list if there's already one saved
  if (creation.plan && creation.plan.length > 0) {
    // Format the todo list into the prompt
    const todoList = creation.plan.map(todo => {
      const emoji = todo.status === 'completed' ? '✅' : todo.status === 'in_progress' ? '⚙️' : '○';
      return `  ${emoji} ${todo.content}`;
    }).join('\n');

    prompt += `

## 当前待办清单
${todoList}

请参考上述待办清单继续推进工作，更新进度，不要完全重新规划。
`;
  }

  return prompt;
}

export const LEAD_AGENT: AgentDefinition = {
  agentType: 'lead',
  whenToUse: 'Main coordinator for the entire creation process',
  description: '首席协调 Agent，负责全程引导用户完成创作，调度专业 Agent',
  systemPrompt: BASE_SYSTEM_PROMPT,
  getSystemPrompt: (context: AgentContext) => {
    return getFullSystemPrompt(context.creation);
  },
  tools: ['*'], // Allow all tools
  disallowedTools: ['generate_image', 'generate_video'], // Cannot call generation directly - must dispatch to visual agent
  maxTurns: 50,
};

export default LEAD_AGENT;
