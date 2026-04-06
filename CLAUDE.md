# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库工作时提供指导。

## 命令

### 依赖安装
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend && npm install
```

### 开发运行
```bash
# 启动后端开发模式 (端口 3001，自动重启)
cd backend && npm run dev

# 启动前端开发模式 (端口 5173)
npm run dev

# 后端编译后启动
cd backend && npm run build && npm start
```

### 构建
```bash
# 构建前端
npm run build

# 构建后端
cd backend && npm run build
```

### 代码检查
```bash
# 运行 eslint 检查
npm run lint
```

## 架构

### 项目概述
JigglyPuff 是一个 **AI 素材灵感收集工作台** + **多 Agent 宠物自媒体创作系统**：
1. 通过 MCP 搜索 Bilibili/小红书热门短视频，离线下载到本地供创作参考
2. 多 Agent 协调完成从爆款分析 → 脚本生成 → 分镜设计 → 视觉生成的全流程

### 技术架构
- **前端**: React 19 + TypeScript + Vite + Ant Design + React Router
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite (better-sqlite3)，数据文件存储在 `data/` 目录
- **外部依赖**: 需要系统安装 `yt-dlp` 用于视频下载
- **AI 生成**: 火山引擎 Seedream（图像生成）+ Seedance（视频生成）
- **MCP**: 使用 `@modelcontextprotocol/sdk` 对接 MCP 服务

### 前端目录结构 (`src/`)
```
src/
├── pages/          # 页面组件
│   ├── Creations/     # 创作中心 (多 Agent 交互)
│   │   ├── components/    # 对话框、消息、素材选择等组件
│   │   ├── hooks/         # 自定义 hooks
│   │   └── CreationsPage.tsx
│   ├── HotTopics/     # 爆款搜索
│   ├── Inspiration/   # 灵感收集
│   ├── Materials/     # 素材库
│   ├── Pets/          # 宠物管理
│   └── Settings/      # 系统设置
│       ├── components/
│       │   ├── LLMConfigPanel.tsx    # LLM 配置
│       │   ├── MCPConfigPanel.tsx    # MCP 服务器配置
│       │   └── AIGenerateConfigPanel.tsx  # AI 生成配置
├── components/     # 通用组件
├── services/       # API 调用封装
├── hooks/          # 自定义 hooks
├── database/       # 前端数据库操作 (Wasm SQLite)
├── types/          # TypeScript 类型定义
├── utils/          # 工具函数
└── assets/         # 静态资源
```

### 后端目录结构 (`backend/src/`)
```
backend/src/
├── agents/                 # Multi-Agent 系统核心框架
│   ├── baseAgent.ts        # Agent 基类
│   ├── agentContext.ts     # Agent 上下文状态管理
│   ├── agentRegistry.ts    # Agent 注册器
│   ├── runAgent.ts         # 核心执行循环
│   ├── forkSubagent.ts     # 子 Agent 分叉执行
│   ├── types.ts            # 类型定义
│   ├── index.ts            # 导出
│   └── built-in/           # 内置 Agent (5 个)
│       ├── index.ts
│       ├── lead.ts              # 主协调 Agent
│       ├── hotVideoAnalyze.ts  # 爆款视频分析 Agent
│       ├── script.ts            # 脚本生成 Agent
│       ├── shot.ts              # 分镜设计 Agent
│       └── visualGenerate.ts    # 视觉生成 Agent (新增)
├── controllers/            # API 控制器
├── routes/                 # API 路由定义
├── database/               # DAO 数据访问层
│   ├── db.ts               # 数据库初始化 & 表结构定义
│   ├── creationDao.ts
│   ├── creationProductDao.ts  # AI 生成作品 DAO (新增)
│   └── ... 其他 DAO
├── tools/                  # Agent 可调用工具 (13 个)
│   ├── baseTool.ts         # 工具基类
│   ├── toolRegistry.ts     # 工具注册器
│   ├── todoWriteTool.ts
│   ├── forkSubagentTool.ts
│   ├── imageGenerateTool.ts  # 图像生成工具 (新增)
│   ├── videoGenerateTool.ts  # 视频生成工具 (新增)
│   └── ... 其他工具
├── services/               # 业务逻辑服务
├── utils/                  # 工具函数
├── types/                  # TypeScript 类型定义
└── index.ts                # 后端入口
```

### 关键架构设计
- **前后端分离**: 前端 Vite 开发服务器代理后端 API
- **数据持久化**: 所有数据存储在 SQLite，`data/` 目录不提交到 git
- **多 Agent 协调**: Lead Agent 调度，支持流式输出 (SSE) 到前端
  - 自动重试（最大 3 次尝试）
  - 重连支持（内存缓存执行状态，5 分钟超时）
  - 结构化步骤输出 `{type: 'assistant_text', content}` 方便扩展
  - 所有子 Agent 消息持久化到聊天记录
- **MCP 集成**: 直接调用 MCP 接口实现热门内容搜索，不经过 Agent 推理提升速度
- **AI 生成集成**: 火山引擎 Seedream/Seedance，生成结果永久存储本地避免 URL 过期

### 数据库表结构
- `pets` - 宠物档案（新增 `portrait` 字段存储宠物写真）
- `llm_configs` - LLM 提供商配置
- `mcp_configs` - MCP 服务器配置
- `materials` - 素材库素材
- `material_categories` - 素材分类
- `trending_videos` - 发现的热门视频
- `resources` - 下载队列和状态
- `creations` - 创作项目（含 `chat_history`、`analysis_result`、`script`、`shots` JSON 字段）
- `creation_products` - AI 生成作品（独立表，新增）

### API 模式
- 素材搜索/下载: 常规 REST API
- Agent 交互: SSE 流式输出执行过程和结果
- 下载进度: 前端轮询查询状态
- 静态文件: `data/uploads/`、`data/resources/`、`data/products/` 分别对应上传、下载、AI 生成
