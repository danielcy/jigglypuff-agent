import type { Pet, LLMConfig, MCPConfig, TrendingVideo, Tool, Resource, MaterialCategory, LibraryMaterial } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, options);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  return response.json();
}

export const petApi = {
  getAll: (): Promise<Pet[]> => request('/pets'),
  getById: (id: string): Promise<Pet> => request(`/pets/${id}`),
  create: (pet: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pet> =>
    request('/pets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pet),
    }),
  update: (id: string, pet: Partial<Pet>): Promise<Pet> =>
    request(`/pets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pet),
    }),
  delete: (id: string): Promise<{ success: boolean }> =>
    request(`/pets/${id}`, {
      method: 'DELETE',
    }),
};

export const llmConfigApi = {
  getAll: (): Promise<LLMConfig[]> => request('/llm-configs'),
  getDefault: (): Promise<LLMConfig | undefined> => request('/llm-configs/default'),
  getById: (id: string): Promise<LLMConfig> => request(`/llm-configs/${id}`),
  create: (config: Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<LLMConfig> =>
    request('/llm-configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    }),
  update: (id: string, config: Partial<LLMConfig>): Promise<LLMConfig> =>
    request(`/llm-configs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    }),
  delete: (id: string): Promise<{ success: boolean }> =>
    request(`/llm-configs/${id}`, {
      method: 'DELETE',
    }),
  setDefault: (id: string): Promise<{ success: boolean }> =>
    request(`/llm-configs/${id}/set-default`, {
      method: 'POST',
    }),
  testConnection: (params: { baseUrl: string; apiKey: string; modelName: string }): Promise<{ success: boolean; message: string }> =>
    request('/llm-configs/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }),
};

export const mcpConfigApi = {
  getAll: (): Promise<MCPConfig[]> => request('/mcp-configs'),
  getById: (id: string): Promise<MCPConfig> => request(`/mcp-configs/${id}`),
  create: (config: Omit<MCPConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<MCPConfig> =>
    request('/mcp-configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    }),
  update: (id: string, config: Partial<MCPConfig>): Promise<MCPConfig> =>
    request(`/mcp-configs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    }),
  delete: (id: string): Promise<{ success: boolean }> =>
    request(`/mcp-configs/${id}`, {
      method: 'DELETE',
    }),
  toggleEnabled: (id: string, enabled: boolean): Promise<{ success: boolean }> =>
    request(`/mcp-configs/${id}/toggle-enabled`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
  testConnection: (params: { serverUrl: string }): Promise<{ success: boolean; message: string }> =>
    request('/mcp-configs/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }),
  autoDeploy: (params: { platform: MCPConfig['platform'] }): Promise<{ success: boolean; message: string; serverUrl: string }> =>
    request('/mcp-configs/auto-deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }),
  startServer: (id: string): Promise<{ success: boolean; message: string }> =>
    request(`/mcp-configs/${id}/start`, {
      method: 'POST',
    }),
  stopServer: (id: string): Promise<{ success: boolean; message: string }> =>
    request(`/mcp-configs/${id}/stop`, {
      method: 'POST',
    }),
  listTools: (serverUrl: string): Promise<{ success: boolean; tools: Tool[]; message?: string }> =>
    request('/mcp-configs/list-tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverUrl }),
    }),
  callTool: (serverUrl: string, name: string, parameters: Record<string, any>): Promise<{ success: boolean; result: any; message?: string }> =>
    request('/mcp-configs/call-tool', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverUrl, name, parameters }),
    }),
};

export interface TrendingSearchRequest {
  keyword: string;
  platforms: string[];
}

export const trendingVideoApi = {
  search: (params: TrendingSearchRequest): Promise<TrendingVideo[]> =>
    request('/trending-videos/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }),
  searchV2: (params: TrendingSearchRequest): Promise<TrendingVideo[]> =>
    request('/trending-videos/search-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }),
  getAll: (): Promise<TrendingVideo[]> => request('/trending-videos'),
};

export interface GetOrCreateResourceRequest {
  platform: string;
  itemId: string;
  originalUrl: string;
}

export const resourceApi = {
  getOrCreate: (params: GetOrCreateResourceRequest): Promise<Resource> =>
    request('/resources/get-or-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }),
  getStatus: (platform: string, itemId: string): Promise<Resource> =>
    request(`/resources/${platform}/${itemId}/status`),
  retry: (platform: string, itemId: string): Promise<Resource> =>
    request('/resources/retry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ platform, itemId }),
    }),
  getAll: (): Promise<Resource[]> => request('/resources'),
  delete: (id: string): Promise<{ success: boolean }> =>
    request(`/resources/${id}`, {
      method: 'DELETE',
    }),
};

export const materialCategoryApi = {
  getAll: (): Promise<MaterialCategory[]> => request('/material-categories'),
  getById: (id: number): Promise<MaterialCategory> => request(`/material-categories/${id}`),
  create: (data: { name: string; description?: string }): Promise<MaterialCategory> =>
    request('/material-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }),
  update: (id: number, data: { name?: string; description?: string }): Promise<MaterialCategory> =>
    request(`/material-categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }),
  delete: (id: number): Promise<{ success: boolean; deletedCount: number }> =>
    request(`/material-categories/${id}`, {
      method: 'DELETE',
    }),
};

export interface CreateLibraryMaterialRequest {
  type: 'image' | 'video';
  source: 'manual' | 'hot-search' | 'agent';
  metadata: string;
  name: string;
  description?: string;
  category_id: number;
  tags?: string;
}

export interface UpdateLibraryMaterialRequest {
  name?: string;
  description?: string;
  category_id?: number;
  tags?: string;
}

export const materialApi = {
  getAll: (categoryId?: number): Promise<LibraryMaterial[]> => {
    const url = categoryId ? `/materials?categoryId=${categoryId}` : '/materials';
    return request(url);
  },
  getById: (id: number): Promise<LibraryMaterial> => request(`/materials/${id}`),
  create: (data: CreateLibraryMaterialRequest): Promise<LibraryMaterial> =>
    request('/materials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateLibraryMaterialRequest): Promise<LibraryMaterial> =>
    request(`/materials/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }),
  delete: (id: number): Promise<{ success: boolean }> =>
    request(`/materials/${id}`, {
      method: 'DELETE',
    }),
};
