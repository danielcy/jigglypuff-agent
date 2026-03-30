import { Request, Response } from 'express';
import * as resourceDao from '../database/resourceDao';
import { triggerDownloadAsync, ensureDirectories } from '../services/resourceDownloader';
import type { Resource } from '../types';

ensureDirectories();

export interface GetOrCreateResourceRequest {
  platform: string;
  itemId: string;
  originalUrl: string;
}

export function getOrCreateResource(req: Request, res: Response) {
  try {
    const { platform, itemId, originalUrl } = req.body as GetOrCreateResourceRequest;
    
    let resource = resourceDao.getResourceByPlatformAndItemId(platform, itemId);
    
    if (!resource) {
      resource = resourceDao.createResource(platform, itemId, originalUrl);
      triggerDownloadAsync(resource);
    } else if (resource.status === 'empty') {
      triggerDownloadAsync(resource);
    }
    
    res.json(resource);
  } catch (error) {
    console.error('[Resource] getOrCreateResource failed:', error);
    res.status(500).json({ error: 'Failed to get or create resource: ' + (error as Error).message });
  }
}

export function getResourceStatus(req: Request, res: Response) {
  try {
    const { platform, itemId } = req.params as { platform: string; itemId: string };
    const resource = resourceDao.getResourceByPlatformAndItemId(platform, itemId);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    res.json(resource);
  } catch (error) {
    console.error('[Resource] getResourceStatus failed:', error);
    res.status(500).json({ error: 'Failed to get resource status: ' + (error as Error).message });
  }
}

export function retryDownload(req: Request, res: Response) {
  try {
    const { platform, itemId } = req.body;
    const resource = resourceDao.getResourceByPlatformAndItemId(platform, itemId);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    triggerDownloadAsync(resource);
    res.json(resource);
  } catch (error) {
    console.error('[Resource] retryDownload failed:', error);
    res.status(500).json({ error: 'Failed to retry download: ' + (error as Error).message });
  }
}

export function getAllResources(req: Request, res: Response) {
  try {
    const resources = resourceDao.getAllResources();
    res.json(resources);
  } catch (error) {
    console.error('[Resource] getAllResources failed:', error);
    res.status(500).json({ error: 'Failed to get all resources: ' + (error as Error).message });
  }
}

export function deleteResource(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    resourceDao.deleteResource(id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Resource] deleteResource failed:', error);
    res.status(500).json({ error: 'Failed to delete resource: ' + (error as Error).message });
  }
}
