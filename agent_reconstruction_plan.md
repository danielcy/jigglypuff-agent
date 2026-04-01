# JigglyPuff Agent 架构重构规划

## Context

**现状分析：**

当前 JigglyPuff 的 Agent 系统比较简单：
- 只有一个 `BaseAgent` 抽象类，包含基本的 LLM 调用和执行循环
- `LeadAgent` 直接继承 `BaseAgent`，在 `run()` 方法中硬编码上下文拼接逻辑
- 专业 Agent（`hotVideoAnalyzeAgent`、`scriptAgent`、`shotAgent`）也都继承 `BaseAgent`
- 所有状态都存在 Agent 实例的 `messages` 数组中，执行完后手动提取保存到 `creation.chatHistory`
- 不支持子 Agent 派生，没有上下文隔离机制
- 资源生命周期管理不清晰

**参考架构：**

参考 Claude Code CLI 的成熟 Agent 架构，核心设计原则：
- **专业化分工**：不同类型的 Agent 专注于不同任务
- **上下文隔离**：每个 Agent 有独立的上下文环境，避免交叉污染
- **灵活执行模式**：支持同步/异步/后台/并行多种执行方式
- **清晰的生命周期**：资源初始化 → 执行 → 清理，完整流程
- **MCP 集成**：每个 Agent 可以配置独立的 MCP 服务器
- **Prompt 缓存优化**：复用前缀减少 token 消耗

## 重构目标

1. 建立清晰的 Agent 定义和加载系统
2. 实现上下文隔离，支持安全派生子 Agent
3. 分离执行循环核心，让不同 Agent 复用同一执行逻辑
4. 完善资源生命周期管理（MCP 连接、文件缓存、abort 控制器）
5. 保持向后兼容：现有专业 Agent 可以逐步迁移
6. 为未来支持多 Agent 并行协作打下基础

## 架构设计

### 目录结构

```
backend/src/agents/
├── baseAgent.ts              # 保留：基础消息/工具调用定义（简化）
├── types.ts                  # 新增：核心类型定义
├── agentRegistry.ts          # 新增：Agent 定义注册和加载
├── agentContext.ts           # 新增：ToolUseContext 上下文隔离
├── runAgent.ts               # 新增：核心执行循环
├── forkSubagent.ts           # 新增：派生子 Agent
├── built-in/                 # 新增：内置 Agent 定义
│   ├── lead.ts              # 主协调 Agent
│   ├── hotVideoAnalyze.ts   # 爆款视频分析 Agent
│   ├── script.ts            # 脚本生成 Agent
│   └── shot.ts              # 分镜生成 Agent
└── utils/
    └── cleanup.ts            # 新增：清理钩子注册执行
```

### 核心组件

#### 1. 类型定义 (`types.ts`)

```typescript
// Agent 定义
export interface AgentDefinition {
  agentType: string;
  whenToUse: string;
  description: string;
  systemPrompt: string | (() => string);
  tools?: string[];           // 允许的工具列表，['*'] 表示所有
  disallowedTools?: string[]; // 禁止的工具列表
  mcpServers?: MCPServerSpec[]; // MCP 服务器配置
  model?: ModelName;           // 模型覆盖
  maxTurns?: number;           // 最大对话轮次
  getSystemPrompt?: () => string; // 动态生成 system prompt
}

// MCP 服务器配置
export type MCPServerSpec =
  | string  // 引用已定义的服务器
  | { name: string; command: string; args: string[] }; // 内联定义

// 执行上下文
export interface AgentContext {
  agentId: string;
  creation: Creation;
  llmConfig: LLMConfig;
  allowedTools: Set<string>;
  abortController: AbortController;
  onStep?: (step: number, content: string, streaming?: boolean) => void;
  cleanup: CleanupHook[];
}

// 清理钩子
export interface CleanupHook {
  description: string;
  cleanup: () => Promise<void> | void;
}

// 执行结果
export interface AgentResult {
  success: boolean;
  messages: AgentMessage[];
  finalAnswer?: string;
  error?: string;
}
```

#### 2. Agent 注册器 (`agentRegistry.ts`)

```typescript
class AgentRegistry {
  private agents: Map<string, AgentDefinition> = new Map();

  registerAgent(def: AgentDefinition): void;
  getAgent(agentType: string): AgentDefinition | undefined;
  getAllAgentTypes(): string[];
}

export default new AgentRegistry();
```

#### 3. 上下文隔离 (`agentContext.ts`)

核心原则：**默认隔离，显式共享**

```typescript
export function createAgentContext(
  parentContext: AgentContext | undefined,
  overrides: {
    creation: Creation;
    llmConfig: LLMConfig;
    onStep?: (step: number, content: string, streaming?: boolean) => void;
  }
): AgentContext;

// 创建子上下文时，克隆父上下文的只读状态，新建可变状态
```

关键隔离点：
- 独立的 `abortController` - 子 Agent 可以独立取消
- 独立的 `cleanup` 列表 - 子 Agent 资源独立清理
- 独立的工具白名单 - 安全限制子 Agent 可用工具

#### 4. 核心执行器 (`runAgent.ts`)

```typescript
export async function runAgent(
  agentDef: AgentDefinition,
  context: AgentContext,
  userInput: string
): Promise<AgentResult>;
```

执行流程（参考 Claude Code CLI）：

```
入口参数：Agent 定义 + 上下文 + 用户输入
  ↓
初始化
  1. 验证允许的工具
  2. 连接 MCP 服务器
  3. 获取 system prompt
  4. 构建初始消息列表
  5. 注册清理钩子
  ↓
执行循环（maxTurns）
  1. 调用 LLM
  2. 流式推送进度到前端（SSE）
  3. 工具调用 → 执行工具 → 收集结果
  4. 重复直至无工具调用或达到 maxTurns
  ↓
清理
  1. 断开 MCP 服务器
  2. 执行所有清理钩子
  3. 返回结果
```

#### 5. 派生 SubAgent (`forkSubagent.ts`)

```typescript
export async function forkSubagent(
  parentContext: AgentContext,
  agentType: string,
  userInput: string,
  options?: {
    runInBackground?: boolean;
    shareContext?: boolean;
  }
): Promise<AgentResult>;
```

Fork 特点：
- 继承父对话上下文
- 共享 prompt 缓存（前缀相同）
- 独立执行不影响父上下文

#### 6. 内置 Agent 定义

**LeadAgent (`built-in/lead.ts`)**:
- 系统提示：首席协调员，理解项目状态，调度专业 Agent
- 工具：`todo_write`, `pet_portrait_update`, `video_analyze`, 等所有工具
- 可派生：hot_analyze, script, shot 等专业 Agent

**HotVideoAnalyzeAgent (`built-in/hotVideoAnalyze.ts`)**:
- 专注：爆款视频分析，提取参考点
- 系统提示：专业分析指令
- 工具：`video_analyze`, `file_read` 等

**ScriptAgent (`built-in/script.ts`)**:
- 专注：视频脚本创作
- 系统提示：专业脚本创作指令

**ShotAgent (`built-in/shot.ts`)**:
- 专注：分镜故事板设计
- 系统提示：专业分镜设计指令

### 向后兼容策略

1. **当前 BaseAgent**：保留，但标记为 `@deprecated`
2. **当前具体 Agent**：保持导出，内部迁移到新架构
3. **控制器入口 (`creations.ts` chat 方法)**：保持接口不变，内部切换到新架构
4. **chatHistory 存储格式**：保持不变，前端不需要修改

## 实施步骤

### Phase 1: 基础设施搭建

1. 创建 `backend/src/agents/types.ts` - 核心类型定义
2. 创建 `backend/src/agents/agentRegistry.ts` - Agent 注册器
3. 创建 `backend/src/agents/agentContext.ts` - 上下文隔离
4. 创建 `backend/src/agents/utils/cleanup.ts` - 清理工具
5. 创建 `backend/src/agents/runAgent.ts` - 核心执行循环
6. 创建 `backend/src/agents/forkSubagent.ts` - 子 Agent 派生

**验证**：单元测试类型和上下文创建

### Phase 2: 迁移内置 Agent 定义

1. 创建 `backend/src/agents/built-in/` 目录
2. 迁移 `leadAgent` → `built-in/lead.ts`
3. 迁移 `hotVideoAnalyzeAgent` → `built-in/hotVideoAnalyze.ts`
4. 迁移 `scriptAgent` → `built-in/script.ts`
5. 迁移 `shotAgent` → `built-in/shot.ts`

**关键点**：
- 原来的 `run()` 方法逻辑现在变成 `systemPrompt` + 工具配置
- 上下文拼接现在在 `runAgent` 执行前完成
- 专业 Agent 通过 Agent 定义配置，不需要写类

### Phase 3: 修改控制器入口

修改 `backend/src/controllers/creations.ts` 中的 `chat` 函数：

```typescript
// 原来：直接根据 agentType new 对应类
// 现在：从 registry 获取 Agent 定义，创建上下文，调用 runAgent

const agentDef = agentRegistry.getAgent(agentType);
if (!agentDef) {
  return res.error(...);
}

const context = createAgentContext(undefined, {
  creation,
  llmConfig: defaultConfig,
  onStep: sendSSE,
});

const result = await runAgent(agentDef, context, message);

// 保存 chatHistory 逻辑不变
```

### Phase 4: 测试和验证

1. 启动后端，测试新建对话
2. 测试每个 Agent 类型：lead, hot_analyze, script, shot
3. 测试历史消息加载
4. 测试工具调用（todo_write, pet_portrait_update 等）
5. 测试 SSE 流式输出
6. 验证资源正确释放（MCP 连接等）

### Phase 5: 清理旧代码

1. 原来的 `leadAgent.ts`, `hotVideoAnalyzeAgent.ts` 等删除
2. `baseAgent.ts` 保留类型定义，删除旧实现
3. 更新注释和文档

## 关键改进点

| 特性 | 现状 | 重构后 |
|------|------|--------|
| 子 Agent 派生 | ❌ 不支持 | ✅ 支持，LeadAgent 可以派生出专业 Agent |
| 上下文隔离 | ❌ 共享状态 | ✅ 默认隔离，安全执行 |
| 资源生命周期 | ❌ 手动管理 | ✅ 自动清理钩子 |
| MCP 每个 Agent | ❌ 全局共享 | ✅ 每个 Agent 可独立配置 |
| 权限控制 | ❌ 无 | ✅ 工具白名单/黑名单 |
| 架构扩展性 | ❌ 硬编码 | ✅ 插件化注册机制 |

## 风险和应对

| 风险 | 应对 |
|------|------|
| 破坏现有功能 | 保持控制器接口不变，逐步迁移 |
| 类型复杂度增加 | 清晰分层，每个文件职责单一 |
| 调试难度增加 | 完善 debug 日志 |

## 验收标准

1. 所有现有功能正常工作：聊天、工具调用、SSE 流式输出、历史消息加载
2. LeadAgent 可以正确派生子专业 Agent
3. 资源使用后正确释放
4. 代码结构清晰，符合 TypeScript 最佳实践
5. 编译通过，无类型错误

## 后续扩展方向

重构完成后，可以轻松支持：

1. **后台长时间运行 Agent**：用户可以做其他操作，完成后通知
2. **多 Agent 并行**：同时多个 Agent 分析不同视频
3. **自定义 Agent**：用户可以在项目层面添加自定义 Agent 类型
4. **Prompt 缓存优化**：fork 子 Agent 复用父上下文前缀，节省 token
