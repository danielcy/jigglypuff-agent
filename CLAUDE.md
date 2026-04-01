# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

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

## Architecture

### 项目概述
JigglyPuff 是一个 **AI 素材灵感收集工作台** + **多 Agent 宠物自媒体创作系统**：
1. 通过 MCP 搜索 Bilibili/小红书热门短视频，离线下载到本地供创作参考
2. 多 Agent 协调完成从爆款分析 → 脚本生成 → 分镜设计的全流程

### 技术架构
- **前端**: React 19 + TypeScript + Vite + Ant Design + React Router
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite (better-sqlite3)，数据文件存储在 `data/` 目录
- **外部依赖**: 需要系统安装 `yt-dlp` 用于视频下载
- **MCP**: 使用 `@modelcontextprotocol/sdk` 对接 MCP 服务

### 前端目录结构 (`src/`)
```
src/
├── pages/          # 页面组件
│   ├── Creations/     # 创作中心 (多 Agent 交互)
│   ├── HotTopics/     # 爆款搜索
│   ├── Inspiration/   # 灵感收集
│   ├── Materials/     # 素材库
│   ├── Pets/          # 宠物管理
│   └── Settings/      # 系统设置
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
├── agents/         # Multi-Agent 系统
│   ├── baseAgent.ts      # Agent 基类
│   ├── leadAgent.ts      # 主协调 Agent
│   ├── hotVideoAnalyzeAgent.ts  # 爆款视频分析
│   ├── scriptAgent.ts    # 脚本生成
│   └── shotAgent.ts      # 分镜生成
├── controllers/    # API 控制器
├── routes/         # 路由定义
├── database/       # DAO 数据访问层
├── services/       # 业务逻辑服务
├── tools/          # Agent 可调用工具
├── types/          # TypeScript 类型定义
└── index.ts        # 后端入口
```

### 关键架构设计
- **前后端分离**: 前端 Vite 开发服务器代理后端 API
- **数据持久化**: 所有数据存储在 SQLite，`data/` 目录不提交到 git
- **多 Agent 协调**: Lead Agent 调度，支持流式输出 (SSE) 到前端
- **MCP 集成**: 直接调用 MCP 接口实现热门内容搜索，不经过 Agent 推理提升速度

### API 模式
- 素材搜索/下载: 常规 REST API
- Agent 交互: SSE 流式输出执行过程和结果
- 下载进度: 前端轮询查询状态
