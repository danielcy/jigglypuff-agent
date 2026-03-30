export interface Pet {
  id: string;
  name: string;
  avatar?: string;
  breed?: string;
  age?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type LLMProvider = 'openai' | 'siliconflow' | 'volcengine' | 'volcengineCoding';

export interface LLMConfig {
  id: string;
  provider: LLMProvider;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  maxTokens?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type MaterialType = 'inspiration' | 'upload';
export type MediaType = 'video' | 'image';

export interface Material {
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
  localPath?: string;
  fileSize?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrendingVideo {
  id: string;
  platform: 'bilibili' | 'xiaohongshu' | 'douyin';
  title: string;
  author: string;
  coverUrl: string;
  videoUrl: string;
  originalUrl?: string;
  views: number;
  likes: number;
  collects?: number;
  publishTime: Date;
  tags: string[];
  description: string;
  addedAt: Date;
}

export interface HotTopic {
  id: string;
  topic: string;
  description: string;
  relatedVideos: number;
  trend: 'rising' | 'hot' | 'declining';
  tags: string[];
  summarizedAt: Date;
}

export type CreationStatus = 'draft' | 'in_progress' | 'completed';

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

export interface SubAgentConfig {
  name: string;
  description: string;
  prompt: string;
  enabled: boolean;
}

export interface Creation {
  id: string;
  title: string;
  petIds: string[];
  materialIds: string[];
  status: CreationStatus;
  plan: TodoItem[];
  content: string;
  subAgents: SubAgentConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrendingSearch {
  keyword: string;
  platforms: string[];
  criteria: {
    minViews?: number;
    minLikes?: number;
    timeRange?: string;
  };
}

export type MCPPlatform = 'bilibili' | 'xiaohongshu';
export type MCPDeployType = 'manual' | 'auto';

export interface MCPConfig {
  id: string;
  platform: MCPPlatform;
  deployType: MCPDeployType;
  serverUrl: string;
  cookie?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolInputSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

export interface Tool {
  name: string;
  description?: string;
  inputSchema: ToolInputSchema;
}

export type ResourceStatus = 'empty' | 'downloading' | 'done' | 'error';

export interface Resource {
  id: string;
  platform: string;
  itemId: string;
  originalUrl: string;
  status: ResourceStatus;
  localPath?: string;
  url?: string;
  downloadAttempts: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
