# JigglyPuff 需求规格说明书

## 项目概述

JigglyPuff（中文名：胖丁）是一个由大模型驱动的宠物视频自媒体一站式创作平台。该平台帮助宠物自媒体创作者从灵感获取到内容创作的全流程工作流，通过AI大模型辅助提升创作效率。

### 技术栈

- **前端框架**: React + TypeScript + Vite
- **UI组件库**: Ant Design
- 后端集成：node.js
- **数据库**: SQLite（本地存储）
- **AI集成**: 支持OpenAI、硅基流动、火山引擎

***

## 功能模块划分

### 1. 宠物信息模块

#### 1.1 功能需求

- 管理宠物基础信息，包括：
  - 宠物姓名
  - 宠物照片
  - 品种（可选）
  - 年龄（可选）
  - 简介（可选）
- 支持添加多只宠物
- 支持编辑宠物信息
- 支持删除宠物信息

#### 1.2 数据模型

```typescript
interface Pet {
  id: string;
  name: string;
  avatar?: string; // 头像照片URL
  breed?: string;
  age?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

***

### 2. 灵感获取模块

#### 2.1 功能需求

- 通过MCP工具从各大自媒体平台获取爆款视频内容
  - B站（使用bilibili-mcp）
  - 小红书（使用xiaohongshu-mcp）
  - 抖音（预留接口）
- 支持用户输入关键词搜索
- 支持用户设置爆款评判标准（如播放量、点赞数、发布时间范围等）
- 使用大模型对获取结果进行智能筛选
- 支持爆款内容预览查看
- 支持将选中的爆款内容存入素材库

#### 2.2 子模块：大家都在拍

- 获取大量热门且同质的内容
- 使用大模型总结近期热门的宠物相关话题
- 将热门话题展示给用户供创作参考

#### 2.3 数据模型

```typescript
interface TrendingSearch {
  keyword: string;
  platforms: string[];
  criteria: {
    minViews?: number;
    minLikes?: number;
    timeRange?: string;
  };
}

interface TrendingVideo {
  id: string;
  platform: 'bilibili' | 'xiaohongshu' | 'douyin';
  title: string;
  author: string;
  coverUrl: string;
  videoUrl: string;
  views: number;
  likes: number;
  publishTime: Date;
  tags: string[];
  description: string;
  addedAt: Date;
}

interface HotTopic {
  id: string;
  topic: string;
  description: string;
  relatedVideos: number;
  trend: 'rising' | 'hot' | 'declining';
  tags: string[];
  summarizedAt: Date;
}
```

***

### 3. 素材库模块

#### 3.1 功能需求

- 支持从灵感获取模块添加素材
  - 存储视频封面
  - 存储视频链接
  - 自动添加标签
- 支持用户上传本地素材
  - 视频文件
  - 图片文件
- 支持素材搜索和筛选
  - 按关键词搜索
  - 按标签筛选
  - 按来源筛选（灵感抓取/本地上传）
  - 按时间筛选
- 支持素材分类管理
- 支持删除素材
- 支持预览素材

#### 3.2 数据模型

```typescript
type MaterialType = 'inspiration' | 'upload';
type MediaType = 'video' | 'image';

interface Material {
  id: string;
  title: string;
  type: MaterialType;
  mediaType: MediaType;
  url: string;
  coverUrl?: string;
  tags: string[];
  sourceInfo?: {
    platform: string;
    originalUrl: string;
    author: string;
  };
  localPath?: string; // 本地上传文件路径
  fileSize?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

***

### 4. 创作模块

#### 4.1 功能需求

- 采用Agent模式引导用户创作
- 支持Plan工作流：
  - 自动生成todo列表
  - 分步引导创作过程
  - 支持用户调整计划
- 支持用户提前从素材库选择素材
- 支持用户自定义并运行子Agent
- 创作过程中可实时调用大模型
- 支持保存创作草稿
- 支持导出创作结果（文案、脚本等）

#### 4.2 数据模型

```typescript
type CreationStatus = 'draft' | 'in_progress' | 'completed';

interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

interface SubAgentConfig {
  name: string;
  description: string;
  prompt: string;
  enabled: boolean;
}

interface Creation {
  id: string;
  title: string;
  petIds: string[]; // 关联的宠物
  materialIds: string[]; // 使用的素材
  status: CreationStatus;
  plan: TodoItem[];
  content: string; // 创作内容
  subAgents: SubAgentConfig[];
  createdAt: Date;
  updatedAt: Date;
}
```

***

### 5. 基础设置模块

#### 5.1 功能需求

- 大模型配置管理
  - 配置baseUrl
  - 配置apiKey
  - 选择模型类型
- 支持配置多个大模型服务商
  - OpenAI
  - 硅基流动
  - 火山引擎
- 支持测试连接
- 支持默认模型设置

#### 5.2 数据模型

```typescript
type LLMProvider = 'openai' | 'siliconflow' | 'volcengine';

interface LLMConfig {
  id: string;
  provider: LLMProvider;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

***

## 数据库设计

### SQLite表结构

#### 1. pets表

```sql
CREATE TABLE pets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  breed TEXT,
  age REAL,
  description TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

#### 2. materials表

```sql
CREATE TABLE materials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  media_type TEXT NOT NULL,
  url TEXT NOT NULL,
  cover_url TEXT,
  tags TEXT,
  source_platform TEXT,
  source_original_url TEXT,
  source_author TEXT,
  local_path TEXT,
  file_size INTEGER,
  description TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

#### 3. trending\_videos表

```sql
CREATE TABLE trending_videos (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  video_url TEXT,
  views INTEGER,
  likes INTEGER,
  publish_time DATETIME,
  tags TEXT,
  description TEXT,
  added_at DATETIME NOT NULL
);
```

#### 4. hot\_topics表

```sql
CREATE TABLE hot_topics (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  description TEXT,
  related_videos INTEGER,
  trend TEXT,
  tags TEXT,
  summarized_at DATETIME NOT NULL
);
```

#### 5. creations表

```sql
CREATE TABLE creations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  pet_ids TEXT,
  material_ids TEXT,
  status TEXT NOT NULL,
  content TEXT,
  plan JSON,
  sub_agents JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

#### 6. llm\_configs表

```sql
CREATE TABLE llm_configs (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

***

## UI设计规范

### 整体布局

- 采用左侧导航 + 右侧内容的经典布局
- 顶部显示应用名称和用户信息
- 响应式设计，适配不同屏幕尺寸

### 色彩方案

- 主色调：柔和粉色（胖丁主题）
- 辅助色：浅蓝色、浅灰色
- 背景色：浅色主题，支持深色模式（后续扩展）

### 导航结构

```
左侧导航：
├── 宠物管理
├── 灵感获取
│   ├── 爆款搜索
│   └── 大家都在拍
├── 素材库
├── 创作中心
└── 设置
```

***

## 非功能性需求

### 性能需求

- 页面响应时间 < 500ms
- 本地数据库查询延迟 < 100ms
- 大模型响应等待友好提示

### 安全性

- API Key加密存储在本地
- 不上传敏感数据到第三方服务器
- 所有数据本地存储，保护用户隐私

### 可扩展性

- 预留其他自媒体平台接口
- 预留更多大模型服务商接口
- 模块间低耦合，易于扩展

***

## MCP集成说明

### 已有的MCP仓库参考

- B站: <https://github.com/adoresever/bilibili-mcp>
- 小红书: <https://github.com/xpzouying/xiaohongshu-mcp>
- 抖音: 待补充

需要研究这些MCP服务的使用方式并集成到项目中。
