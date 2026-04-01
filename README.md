# 🐱 JigglyPuff

<div align="center">

**AI 素材灵感收集工作台 + 多 Agent 宠物自媒体全自动创作系统**

[!\[License: MIT\](https://img.shields.io/badge/License-MIT-yellow.svg null)](https://opensource.org/licenses/MIT)

通过 MCP 搜索热门短视频，离线下载到本地素材库，再由多 Agent 协作完成 **爆款分析 → 脚本生成 → 分镜设计** 全流程。

</div>

## 📖 目录

- [✨ 功能特性](#-功能特性)
- [⚙️ 技术栈](#️-技术栈)
- [🚀 快速开始](#-快速开始)
- [📁 项目结构](#-项目结构)
- [🎯 使用流程](#-使用流程)
- [🔧 故障排查](#-故障排查)
- [📝 TODO](#-todo)
- [📄 License](#-license)

***

## ✨ 功能特性

### 🔍 MCP 热门内容搜索

- ✅ **Bilibili 热门搜索** - 按点击量排序，快速找到爆款
- ✅ **小红书笔记搜索** - 支持筛选视频类型、按点赞排序
- ✅ **直连 MCP 接口** - v2 接口直接调用，不经过 Agent 推理，搜索速度更快

### 📥 离线下载与素材管理

- ✅ **后台异步下载** - SQLite 记录下载状态，前端轮询进度
- ✅ **下载失败自动重试** - 最多重试 3 次
- ✅ **依赖系统 yt-dlp** - 成熟稳定，支持绝大多数站点
- ✅ **素材库分类管理** - 手动上传 + 搜索结果一键添加，支持预览、搜索筛选

### 🤖 多 Agent 全自动创作

| Agent                    | 职责                             |
| ------------------------ | ------------------------------ |
| **LeadAgent**            | 主调度协调，记住 todo 列表，持续推进项目        |
| **HotVideoAnalyzeAgent** | 爆款视频深度分析，拆解热门原因和可复刻要点          |
| **ScriptAgent**          | 根据分析生成完整宠物视频脚本                 |
| **ShotAgent**            | 脚本转成分镜设计，包含时长、景别、运镜、画面描述、台词、音效 |

- ✅ **SSE 流式输出** - 前端实时展示执行过程
- ✅ **逐字段编辑** - 每一步结果支持点击图标直接编辑单个字段，无需编辑整个 JSON
- ✅ **聊天历史持久化** - 支持多轮对话继续创作
- ✅ **子 Agent 消息完整保存** - 所有中间步骤都存入聊天历史，可追溯
- ✅ **多模态附件支持** - 从素材库选择图片/视频作为参考素材发给 Agent
- ✅ **LLM API 自动重试** - 调用失败自动重试最多 3 次，大幅提升成功率
- ✅ **断开重连支持** - 后端内存缓存正在执行的 Agent 状态，关闭页面再打开仍可恢复消息流

### 🐾 宠物管理

- ✅ 宠物信息管理（头像、年龄、品种）
- ✅ 创作时可绑定宠物，Agent 会结合宠物特点生成个性化内容

***

## ⚙️ 技术栈

| 层级        | 技术                                                            |
| --------- | ------------------------------------------------------------- |
| **前端**    | React 19 + TypeScript + Vite + Ant Design                     |
| **后端**    | Node.js + Express + TypeScript                                |
| **数据库**   | SQLite (better-sqlite3)                                       |
| **下载**    | [yt-dlp](https://github.com/yt-dlp/yt-dlp) (系统命令行调用)          |
| **AI 框架** | OpenAI 兼容 API，支持任意 LLM 服务商                                    |
| **MCP**   | [Model Context Protocol](https://modelcontextprotocol.io/) 集成 |

***

## 🚀 快速开始

### 1. 环境要求

- Node.js 18+
- 系统已安装 `yt-dlp` ([安装指南](https://github.com/yt-dlp/yt-dlp#installation))
- 配置好 LLM API 密钥（OpenAI 兼容格式）

### 2. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend && npm install
```

### 3. 开发运行

```bash
# 启动后端 (端口 3001)
cd backend && npm run dev

# 启动前端 (端口 5173)
# 在另一个终端运行
npm run dev
```

### 4. 生产构建

```bash
# 构建前端
npm run build

# 构建后端
cd backend && npm run build

# 启动后端
npm start
```

***

## 📁 项目结构

```
jigglypuff/
├── src/                          # 前端代码
│   ├── pages/
│   │   ├── Creations/            # 创作中心 - 多 Agent 交互
│   │   ├── HotTopics/            # 爆款搜索
│   │   ├── Inspiration/          # 灵感收集
│   │   ├── Materials/            # 素材库
│   │   ├── Pets/                 # 宠物管理
│   │   └── Settings/             # 系统设置（LLM/MCP 配置）
│   ├── components/               # 通用组件
│   ├── services/                 # API 调用封装
│   ├── types/                    # TypeScript 类型定义
│   └── ...
├── backend/
│   ├── src/
│   │   ├── agents/               # Multi-Agent 系统
│   │   │   ├── runAgent.ts       # 核心执行循环 (LLM → tool call → LLM)
│   │   │   ├── leadAgent.ts      # 主协调 Agent
│   │   │   ├── hotVideoAnalyzeAgent.ts  # 爆款视频分析
│   │   │   ├── scriptAgent.ts     # 脚本生成
│   │   │   ├── shotAgent.ts       # 分镜生成
│   │   │   └── ...
│   │   ├── controllers/          # API 控制器
│   │   ├── routes/               # 路由定义
│   │   ├── database/             # DAO 数据访问层
│   │   ├── tools/                # Agent 可调用工具
│   │   └── types/                # TypeScript 类型定义
│   └── package.json
├── data/             # SQLite 数据库 + 下载的资源 (git ignored)
└── ...
```

***

## 🎯 使用流程

1. **配置 LLM** - 在设置页面添加默认 LLM 配置（API Key, Base URL, 模型名称）
2. **配置 MCP** - 在设置页面添加 MCP 服务器配置用于搜索热门内容
3. **添加宠物** - 在宠物管理页面添加你宠物的信息
4. **搜索爆款** - 去热门搜索页面搜索相关关键词，下载你喜欢的视频
5. **添加到素材库** - 下载完成后一键添加到素材库分类
6. **开始创作** - 新建创作项目，绑定宠物，输入你的创意想法
7. **多 Agent 协作** - Lead Agent 会自动调度子 Agent 完成分析 → 脚本 → 分镜
8. **编辑调整** - 对生成结果不满意可以直接编辑单个字段，继续对话让 Agent 修改

***

## 🔧 故障排查

**Q: 下载失败**

> A: 检查系统是否安装 yt-dlp，网络是否能访问目标网站。

**Q: LLM 经常随机失败**

> A: 现在已经添加自动重试（最多 3 次），大部分临时错误会自愈。

**Q: 断开网络再连接后看不到正在运行的进度**

> A: 现在已经支持断开重连，刷新页面会自动接收已缓存进度并继续。

***

## 📝 TODO

- [ ] 创作完成后预览导出
- [ ] 草稿自动保存
- [ ] 更多 MCP 平台支持
- [ ] 提示词模板管理

***

## 📄 License

MIT License - see [LICENSE](LICENSE) for details
