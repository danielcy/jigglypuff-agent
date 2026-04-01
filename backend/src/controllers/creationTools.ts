import { Request, Response } from 'express';
import * as creationToolDao from '../database/creationToolDao';
import type { CreationTool } from '../types';

export function listTools(req: Request, res: Response) {
  try {
    creationToolDao.initDefaultTools();
    const tools = creationToolDao.getAllTools();
    res.json({
      code: 0,
      message: 'success',
      data: tools,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function updateTool(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body as Partial<CreationTool>;
    const tool = creationToolDao.updateToolConfig(id as string, updates);
    if (!tool) {
      return res.status(404).json({
        code: 1,
        message: 'Tool not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: tool,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}
