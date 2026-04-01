# JigglyPuff

AI 素材灵感收集工作台 + **多 Agent 宠物自媒体创作系统** - 通过 MCP 搜索热门短视频，离线下载到本地，再由多 Agent 协作完成爆款分析 → 脚本生成 → 分镜设计全流程。

## 功能特性

### ✅ 已完成

- **MCP 热门搜索**
  - Bilibili 热门视频搜索，支持按点击量排序
  - 小红书笔记搜索，支持筛选视频类型、按点赞排序
  - v2 接口直接调用 MCP，不经过 Agent 推理，速度更快

- **离线下载**
  - 点击搜索结果卡片唤起详情弹窗
  - 后台异步下载，SQLite 记录下载状态
  - 前端每 3 秒轮询进度
  - 下载失败支持重试，每次最多重试 3 次
  - 使用系统 `yt-dlp` 直接下载，不依赖 npm 包
  - 下载完成直接在弹窗播放

- **素材库管理**
  - 手动上传图片/视频素材
  - 支持分类管理，搜索筛选
  - 弹窗预览素材
  - 爆款搜索结果一键添加到素材库

- **多 Agent 宠物视频创作**
  - Lead Agent 主调度，全程 SSE 流式输出执行过程
  - HotVideoAnalyzeAgent：爆款视频分析，拆解热门原因和复刻建议
  - ScriptAgent：根据分析生成完整脚本
  - ShotAgent：脚本转成分镜设计，包含时长、景别、运镜、画面描述、台词、音效
  - 每一步结果支持**逐字段编辑**，点击小图标直接编辑单个字段，无需编辑整个 JSON
  - 聊天历史持久保存，支持多轮对话继续创作

- **宠物管理**
  - 宠物信息管理，头像、年龄、品种等
  - 创作时可绑定宠物，Agent 会结合宠物特点生成内容

- **UI 界面**
  - 基于 Ant Design 的 React 前端
  - 搜索结果卡片展示，支持分页
  - 弹窗最大高度限制，视频自适应容器

## 技术栈

- **前端**: React + TypeScript + Vite + Ant Design
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite
- **下载**: [yt-dlp](https://github.com/yt-dlp/yt-dlp) (命令行调用)

## 快速开始

### 依赖安装

```bash
# 前端依赖
npm install

# 后端依赖
cd backend && npm install
```

### 环境要求

- 需要系统已安装 `yt-dlp`
- Node.js 18+

### 开发运行

```bash
# 启动后端 (端口 3001)
cd backend && npm run build && npm start

# 启动前端 (端口 5173)
npm run dev
```

## 项目结构

```
jigglypuff/
├── src/                          # 前端代码
│   ├── pages/
│   │   ├── Creations/            # 创作中心 (多 Agent 交互)
│   │   ├── HotTopics/            # 爆款搜索
│   │   ├── Inspiration/          # 灵感收集
│   │   ├── Materials/            # 素材库
│   │   ├── Pets/                 # 宠物管理
│   │   └── Settings/             # 系统设置
├── backend/
│   ├── src/
│   │   ├── agents/               # Multi-Agent 系统 (重构后)
│   │   │   ├── agentContext.ts   # Agent 上下文定义
│   │   │   ├── agentRegistry.ts  # Agent 注册中心
│   │   │   ├── baseAgent.ts      # Agent 基类
│   │   │   ├── built-in/         # 内置 Agent 实现
│   │   │   │   ├── leadAgent.ts      # 主协调 Agent
│   │   │   │   ├── hotVideoAnalyzeAgent.ts  # 爆款视频分析
│   │   │   │   ├── scriptAgent.ts     # 脚本生成
│   │   │   │   └── shotAgent.ts       # 分镜生成
│   │   │   ├── runAgent.ts       # 核心执行循环 (LLM -> tool -> LLM)
│   │   │   ├── types.ts          # Agent 系统类型定义
│   │   ├── controllers/          # API 控制器
│   │   ├── routes/               # 路由定义
│   │   ├── database/             # 数据访问层
│   │   ├── tools/                # Agent 可调用工具 (todo_write, script_save 等)
│   │   └── types/                # TypeScript 类型定义
│   └── package.json
├── data/             # SQLite 数据库 + 下载的资源 (git ignored)
└── ...
```

## TODO

- [ ] 创作完成后预览导出
- [ ] 草稿自动保存
- [ ] 更多 MCP 平台支持

## License

MIT
