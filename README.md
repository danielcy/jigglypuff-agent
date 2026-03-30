# JigglyPuff

AI 素材灵感收集工作台 - 通过 MCP 搜索热门短视频，离线下载到本地供创作参考。

## 功能特性

### ✅ 已完成

- **MCP 搜索**
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
├── src/               # 前端代码
├── backend/
│   ├── src/
│   │   ├── controllers/  # API 控制器
│   │   ├── services/     # 业务逻辑
│   │   ├── database/     # 数据访问层
│   │   └── routes/       # 路由定义
│   └── package.json
├── data/             # SQLite 数据库 + 下载的资源 (git ignored)
└── ...
```

## TODO

- [ ] 素材库分类管理
- [ ] 标签系统
- [ ] 创作草稿保存
- [ ] 宠物灵感生成
- [ ] 导出素材包

## License

MIT
