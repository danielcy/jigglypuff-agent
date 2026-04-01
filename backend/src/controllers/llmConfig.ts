import { Request, Response } from 'express';
import * as llmConfigDao from '../database/llmConfigDao';
import type { LLMConfig } from '../types';

export function getAllConfigs(req: Request, res: Response) {
  try {
    const configs = llmConfigDao.getAllLLMConfigs();
    res.json({
      code: 0,
      message: 'success',
      data: configs,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function getDefaultConfig(req: Request, res: Response) {
  try {
    const config = llmConfigDao.getDefaultLLMConfig();
    res.json({
      code: 0,
      message: 'success',
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function getConfigById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const config = llmConfigDao.getLLMConfigById(id as string);
    if (!config) {
      return res.status(404).json({
        code: 1,
        message: 'Config not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function createConfig(req: Request, res: Response) {
  try {
    const configData = req.body;
    const config = llmConfigDao.createLLMConfig(configData);
    res.status(201).json({
      code: 0,
      message: 'success',
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function updateConfig(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const configData = req.body;
    const config = llmConfigDao.updateLLMConfig(id as string, configData);
    if (!config) {
      return res.status(404).json({
        code: 1,
        message: 'Config not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function deleteConfig(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const success = llmConfigDao.deleteLLMConfig(id as string);
    if (!success) {
      return res.status(404).json({
        code: 1,
        message: 'Config not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: { success: true },
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function setDefault(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const success = llmConfigDao.setDefaultLLMConfig(id as string);
    if (!success) {
      return res.status(404).json({
        code: 1,
        message: 'Config not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: { success: true },
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
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
      res.json({
        code: 0,
        message: 'success',
        data: { success: true, message: '连接成功' },
      });
    } else {
      const error = await response.text();
      res.json({
        code: 0,
        message: 'success',
        data: { success: false, message: `连接失败: ${response.status} ${error}` },
      });
    }
  } catch (error) {
    res.json({
      code: 0,
      message: 'success',
      data: { success: false, message: `连接失败: ${(error as Error).message}` },
    });
  }
}
