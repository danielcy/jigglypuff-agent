import { getStorage, setStorage } from './db';
import type { LLMConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function getAllLLMConfigs(): LLMConfig[] {
  return getStorage().llmConfigs;
}

export function getDefaultLLMConfig(): LLMConfig | undefined {
  return getStorage().llmConfigs.find(c => c.isDefault);
}

export function getLLMConfigById(id: string): LLMConfig | undefined {
  return getStorage().llmConfigs.find(c => c.id === id);
}

export function createLLMConfig(config: Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt'>): LLMConfig {
  if (config.isDefault) {
    getStorage().llmConfigs.forEach(c => {
      c.isDefault = false;
    });
  }
  const newConfig: LLMConfig = {
    id: uuidv4(),
    ...config,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const storage = getStorage();
  setStorage({
    llmConfigs: [...storage.llmConfigs, newConfig],
  });
  return newConfig;
}

export function updateLLMConfig(id: string, config: Partial<LLMConfig>): LLMConfig | undefined {
  const storage = getStorage();
  const index = storage.llmConfigs.findIndex(c => c.id === id);
  if (index === -1) return undefined;

  if (config.isDefault) {
    storage.llmConfigs.forEach(c => {
      c.isDefault = false;
    });
  }

  const updatedConfig = {
    ...storage.llmConfigs[index],
    ...config,
    updatedAt: new Date(),
  };
  const newConfigs = [...storage.llmConfigs];
  newConfigs[index] = updatedConfig;
  setStorage({
    llmConfigs: newConfigs,
  });
  return updatedConfig;
}

export function deleteLLMConfig(id: string): boolean {
  const storage = getStorage();
  const initialLength = storage.llmConfigs.length;
  const newConfigs = storage.llmConfigs.filter(c => c.id !== id);
  if (newConfigs.length === initialLength) return false;
  setStorage({
    llmConfigs: newConfigs,
  });
  return true;
}

export function setDefaultLLMConfig(id: string): boolean {
  const storage = getStorage();
  const config = storage.llmConfigs.find(c => c.id === id);
  if (!config) return false;
  storage.llmConfigs.forEach(c => {
    c.isDefault = false;
  });
  config.isDefault = true;
  setStorage({
    llmConfigs: [...storage.llmConfigs],
  });
  return true;
}
