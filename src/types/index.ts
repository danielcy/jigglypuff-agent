export interface Pet {
  id: string;
  name: string;
  avatar?: string;
  breed?: string;
  age?: number;
  description?: string;
  portrait?: string;
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

export interface ChatMessage {
  id: string;
  role: 'card' | 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  toolName?: string;
  toolArgs?: Record<string, any>;
  timestamp: Date;
  attachments?: Array<{
    id: number;
    name: string;
    url: string;
    type: 'image' | 'video';
  }>;
}

export type CreationStatus = 'draft' | 'in_progress' | 'completed';
export type CreationStage = 'idle' | 'analysis' | 'scripting' | 'shotting' | 'done';

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

export interface HotVideoAnalysis {
  videoUrl: string;
  title: string;
  hotReasons: {
    content: string;
    style: string;
    tags: string[];
    structure: string;
  };
  copyAdvice: {
    concept: string;
    adjustments: string[];
    keyPoints: string[];
  };
  analyzedAt: Date;
  revisedAt?: Date;
}

export interface ScriptScene {
  id: string;
  sceneNo: number;
  title: string;
  duration: number;
  description: string;
  dialogue?: string;
  bgmSuggestion?: string;
}

export interface Script {
  title: string;
  description: string;
  totalDuration: number;
  sceneCount: number;
  scenes: ScriptScene[];
  tags: string[];
  generatedAt: Date;
  revisedAt?: Date;
}

export type ShotSize = '远景' | '全景' | '中景' | '近景' | '特写';
export type CameraMovement = '固定' | '推' | '拉' | '摇' | '移' | '跟' | '环绕';

export interface Shot {
  id: string;
  shotNo: number;
  duration: number;
  shotSize: ShotSize;
  cameraMovement: CameraMovement;
  description: string;
  dialogue?: string;
  soundEffect?: string;
  bgm?: string;
  draftImageUrl?: string;
}

export interface ShotList {
  scriptId: string;
  totalDuration: number;
  shots: Shot[];
 generatedAt: Date;
  revisedAt?: Date;
}

export type CreationProductType = 'image' | 'video';

export interface CreationProduct {
  id: string;
  type: CreationProductType;
  url: string;
  prompt: string;
  generatedAt: Date;
}

export interface CreationTool {
  id: string;
  toolName: string;
  enabled: boolean;
  config?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SSEEvent {
  event: string;
  data: any;
}

export interface SSEStepEvent {
  type: 'thinking' | 'tool_call' | 'tool_result';
  content?: string;
  toolName?: string;
  args?: Record<string, any>;
  result?: any;
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
  currentStage: CreationStage;
  content?: string;
  plan: TodoItem[];
  chatHistory: ChatMessage[];
  analysisResult?: HotVideoAnalysis;
  script?: Script;
  shots?: ShotList;
  products?: CreationProduct[];
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

export interface MaterialCategory {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

export type LibraryMaterialType = 'image' | 'video';
export type LibraryMaterialSource = 'manual' | 'hot-search' | 'agent';

export interface LibraryMaterial {
  id: number;
  type: LibraryMaterialType;
  source: LibraryMaterialSource;
  metadata: Record<string, any>;
  name: string;
  description?: string;
  categoryId: number;
  tags?: string[];
  createdAt: string;
}

export interface MaterialMetadata {
  imageUrl?: string;
  videoUrl?: string;
  coverUrl?: string;
}

export type AgentStepContent =
  | { type: 'assistant_text'; content: string }
  | { type: 'tool_call'; toolCalls: AgentToolCall[] }
  | { type: 'tool_result'; toolCallId: string; content: string };

export interface AgentToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}
