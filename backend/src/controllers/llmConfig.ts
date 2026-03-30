import { Request, Response } from 'express';
import * as llmConfigDao from '../database/llmConfigDao';
import type { LLMConfig } from '../types';

export function getAllConfigs(req: Request, res: Response) {
  const configs = llmConfigDao.getAllLLMConfigs();
  res.json(configs);
}

export function getDefaultConfig(req: Request, res: Response) {
  const config = llmConfigDao.getDefaultLLMConfig();
  res.json(config);
}

export function getConfigById(req: Request, res: Response) {
  const { id } = req.params;
  const config = llmConfigDao.getLLMConfigById(id as string);
  if (!config) {
    return res.status(404).json({ error: 'Config not found' });
  }
  res.json(config);
}

export function createConfig(req: Request, res: Response) {
  const configData = req.body;
  const config = llmConfigDao.createLLMConfig(configData);
  res.status(201).json(config);
}

export function updateConfig(req: Request, res: Response) {
  const { id } = req.params;
  const configData = req.body;
  const config = llmConfigDao.updateLLMConfig(id as string, configData);
  if (!config) {
    return res.status(404).json({ error: 'Config not found' });
  }
  res.json(config);
}

export function deleteConfig(req: Request, res: Response) {
  const { id } = req.params;
  const success = llmConfigDao.deleteLLMConfig(id as string);
  if (!success) {
    return res.status(404).json({ error: 'Config not found' });
  }
  res.json({ success: true });
}

export function setDefault(req: Request, res: Response) {
  const { id } = req.params;
  const success = llmConfigDao.setDefaultLLMConfig(id as string);
  if (!success) {
    return res.status(404).json({ error: 'Config not found' });
  }
  res.json({ success: true });
}

export async function testConnection(req: Request, res: Response) {
  try {
    const { baseUrl, apiKey, modelName } = req.body;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      res.json({ success: true, message: '连接成功' });
    } else {
      const error = await response.text();
      res.json({ success: false, message: `连接失败: ${response.status} ${error}` });
    }
  } catch (error) {
    res.json({ success: false, message: `连接失败: ${(error as Error).message}` });
  }
}
