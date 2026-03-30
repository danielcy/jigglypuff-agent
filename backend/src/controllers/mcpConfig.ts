import { Request, Response } from 'express';
import * as mcpConfigDao from '../database/mcpConfigDao';
import type { MCPConfig, Tool } from '../types';
import { MCPClient } from '../services/mcpClient';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const mcpDir = path.join(__dirname, '../../../.mcp');

export function getAllConfigs(req: Request, res: Response) {
  const configs = mcpConfigDao.getAllMCPConfigs();
  res.json(configs);
}

export function getConfigById(req: Request, res: Response) {
  const { id } = req.params;
  const config = mcpConfigDao.getMCPConfigById(id as string);
  if (!config) {
    return res.status(404).json({ error: 'Config not found' });
  }
  res.json(config);
}

export function createConfig(req: Request, res: Response) {
  const configData = req.body;
  const config = mcpConfigDao.createMCPConfig(configData);
  res.status(201).json(config);
}

export function updateConfig(req: Request, res: Response) {
  const { id } = req.params;
  const configData = req.body;
  const config = mcpConfigDao.updateMCPConfig(id as string, configData);
  if (!config) {
    return res.status(404).json({ error: 'Config not found' });
  }
  res.json(config);
}

export function deleteConfig(req: Request, res: Response) {
  const { id } = req.params;
  const success = mcpConfigDao.deleteMCPConfig(id as string);
  if (!success) {
    return res.status(404).json({ error: 'Config not found' });
  }
  res.json({ success: true });
}

export function toggleEnabled(req: Request, res: Response) {
  const { id } = req.params;
  const { enabled } = req.body;
  const success = mcpConfigDao.toggleEnabled(id as string, enabled);
  if (!success) {
    return res.status(404).json({ error: 'Config not found' });
  }
  res.json({ success: true });
}

export async function testConnection(req: Request, res: Response) {
  try {
    const { serverUrl } = req.body;

    try {
      const response = await fetch(serverUrl.replace(/\/$/, ''), {
        method: 'GET',
      });
      if (response.ok) {
        res.json({ success: true, message: '连接成功' });
      } else {
        res.json({ success: false, message: `连接失败: ${response.status}` });
      }
    } catch (error) {
      res.json({ success: false, message: `连接失败: ${(error as Error).message}` });
    }
  } catch (error) {
    res.json({ success: false, message: `测试失败: ${(error as Error).message}` });
  }
}

export async function autoDeploy(req: Request, res: Response) {
  try {
    const { platform } = req.body;
    const repoMap = {
      bilibili: 'https://github.com/adoresever/bilibili-mcp.git',
      xiaohongshu: 'https://github.com/xpzouying/xiaohongshu-mcp.git',
    };

    const targetDir = path.join(mcpDir, platform);

    if (!fs.existsSync(mcpDir)) {
      fs.mkdirSync(mcpDir, { recursive: true });
    }

    if (fs.existsSync(targetDir)) {
      res.json({ success: true, message: `${platform} MCP 已经部署`, serverUrl: `http://localhost:${platform === 'bilibili' ? 8001 : 8002}` });
      return;
    }

    res.json({ success: true, message: `开始部署 ${platform} MCP...`, serverUrl: `http://localhost:${platform === 'bilibili' ? 8001 : 8002}` });

    console.log(`Cloning ${repoMap[platform as keyof typeof repoMap]} to ${targetDir}`);

    const clone = spawn('git', ['clone', repoMap[platform as keyof typeof repoMap], targetDir]);

    clone.on('close', (code) => {
      console.log(`git clone exited with code ${code}`);
      if (code === 0) {
        console.log('Installing dependencies...');
        const install = spawn('npm', ['install'], { cwd: targetDir });
        install.on('close', (installCode) => {
          console.log(`npm install exited with code ${installCode}`);
        });
      }
    });

    clone.on('error', (error) => {
      console.error('git clone error:', error);
    });
  } catch (error) {
    res.json({ success: false, message: `部署失败: ${(error as Error).message}` });
  }
}

const runningProcesses: Map<string, any> = new Map();

export function startServer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const config = mcpConfigDao.getMCPConfigById(id as string);
    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }

    if (runningProcesses.has(id as string)) {
      return res.json({ success: true, message: '已经在运行中' });
    }

    let process;
    if (config.deployType === 'auto') {
      const targetDir = path.join(mcpDir, config.platform);
      const entry = path.join(targetDir, 'build', 'index.js');
      if (!fs.existsSync(entry)) {
        return res.json({ success: false, message: 'MCP 未构建，请先完成部署' });
      }
      process = spawn('node', [entry]);
    } else {
      return res.json({ success: false, message: '手动配置需要自己启动服务' });
    }

    runningProcesses.set(id as string, process);

    process.on('exit', (code) => {
      console.log(`MCP process exited with code ${code}`);
      runningProcesses.delete(id as string);
    });

    process.stdout.on('data', (data) => {
      console.log(`MCP stdout: ${data}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`MCP stderr: ${data}`);
    });

    const port = config.platform === 'bilibili' ? 8001 : 8002;
    res.json({ success: true, message: '服务已启动', serverUrl: `http://localhost:${port}` });
  } catch (error) {
    res.json({ success: false, message: `启动失败: ${(error as Error).message}` });
  }
}

export function stopServer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const process = runningProcesses.get(id as string);
    if (!process) {
      return res.json({ success: true, message: '服务未运行' });
    }
    process.kill();
    runningProcesses.delete(id as string);
    res.json({ success: true, message: '服务已停止' });
  } catch (error) {
    res.json({ success: false, message: `停止失败: ${(error as Error).message}` });
  }
}

export async function listTools(req: Request, res: Response) {
  try {
    const { serverUrl } = req.body;
    
    if (!serverUrl) {
      return res.json({ success: false, message: 'serverUrl is required' });
    }

    const client = new MCPClient({ serverUrl });
    try {
      const result = await client.listTools();
      res.json({ success: true, tools: result.tools });
      await client.disconnect();
    } catch (error) {
      res.json({ success: false, message: (error as Error).message });
      await client.disconnect();
    }
  } catch (error) {
    res.json({ success: false, message: `获取工具列表失败: ${(error as Error).message}` });
  }
}

export async function callTool(req: Request, res: Response) {
  try {
    const { serverUrl, name, parameters } = req.body;
    
    if (!serverUrl || !name) {
      return res.json({ success: false, message: 'serverUrl and name are required' });
    }

    const client = new MCPClient({ serverUrl });
    try {
      const result = await client.callTool(name, parameters || {});
      res.json({ success: !result.isError, result: result.content });
      await client.disconnect();
    } catch (error) {
      res.json({ success: false, message: (error as Error).message });
      await client.disconnect();
    }
  } catch (error) {
    res.json({ success: false, message: `调用工具失败: ${(error as Error).message}` });
  }
}
