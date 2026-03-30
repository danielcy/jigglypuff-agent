import type { Pet, LLMConfig, Material, Creation, TrendingVideo, HotTopic } from '../types';

interface StorageData {
  pets: Pet[];
  llmConfigs: LLMConfig[];
  materials: Material[];
  trendingVideos: TrendingVideo[];
  hotTopics: HotTopic[];
  creations: Creation[];
}

const DEFAULT_STORAGE: StorageData = {
  pets: [],
  llmConfigs: [],
  materials: [],
  trendingVideos: [],
  hotTopics: [],
  creations: [],
};

function loadStorage(): StorageData {
  try {
    const data = localStorage.getItem('jigglypuff');
    if (!data) {
      return DEFAULT_STORAGE;
    }
    const parsed = JSON.parse(data);
    return {
      ...DEFAULT_STORAGE,
      ...parsed,
    };
  } catch (error) {
    console.error('Failed to load storage:', error);
    return DEFAULT_STORAGE;
  }
}

function saveStorage(data: StorageData): void {
  try {
    localStorage.setItem('jigglypuff', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save storage:', error);
  }
}

let storage: StorageData = loadStorage();

export function initDatabase(): Promise<void> {
  storage = loadStorage();
  console.log('Database initialized successfully');
  return Promise.resolve();
}

export function getStorage(): StorageData {
  return storage;
}

export function setStorage(newStorage: Partial<StorageData>): void {
  storage = {
    ...storage,
    ...newStorage,
  };
  saveStorage(storage);
}

export function closeDatabase(): void {
}

export function isInitialized(): boolean {
  return true;
}
