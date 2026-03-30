import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import * as resourceDao from '../database/resourceDao';
import type { Resource } from '../types';

const DATA_ROOT = path.join(__dirname, '../../../data');
const RESOURCES_DIR = path.join(DATA_ROOT, 'resources');

export function ensureDirectories() {
  if (!fs.existsSync(DATA_ROOT)) {
    fs.mkdirSync(DATA_ROOT, { recursive: true });
  }
  if (!fs.existsSync(RESOURCES_DIR)) {
    fs.mkdirSync(RESOURCES_DIR, { recursive: true });
  }
}

export async function startDownload(resource: Resource): Promise<void> {
  const platformDir = path.join(RESOURCES_DIR, resource.platform);
  if (!fs.existsSync(platformDir)) {
    fs.mkdirSync(platformDir, { recursive: true });
  }

  const ext = 'mp4';
  const filename = `${resource.itemId}.${ext}`;
  const fullPath = path.join(platformDir, filename);
  const relativePath = `data/resources/${resource.platform}/${filename}`;
  const publicUrl = `/resources/${resource.platform}/${filename}`;

  const downloadUrl = resource.platform === 'xiaohongshu' 
    ? `https://www.xiaohongshu.com/explore/${resource.itemId}`
    : `https://www.bilibili.com/video/${resource.itemId}`;

  resourceDao.updateResourceStatus(resource.id, 'downloading');

  console.log(`[ResourceDownloader] Starting download: ${downloadUrl} -> ${fullPath}`);

  const args = [
    downloadUrl,
    '-o', fullPath,
    '--retries', '3',
  ];

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const process = spawn(`yt-dlp`, args);

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
          stdout += data.toString();
          console.log(`[yt-dlp] ${data.toString()}`);
        });

        process.stderr.on('data', (data) => {
          stderr += data.toString();
          console.log(`[yt-dlp stderr] ${data.toString()}`);
        });

        process.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`yt-dlp exited with code ${code}\n${stderr}`));
          }
        });

        process.on('error', (error) => {
          reject(error);
        });
      });
      await sleep(3000);

      if (fs.existsSync(fullPath)) {
        resourceDao.updateResourceAfterDownload(resource.id, relativePath, publicUrl);
        console.log(`[ResourceDownloader] Resource ${resource.id} updated to done`);
        return;
      } else {
        throw new Error('Download completed but output file not found');
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[ResourceDownloader] Attempt ${attempt + 1}/3 failed for ${resource.id}:`, lastError.message);
    }
  }

  const errorMessage = lastError ? lastError.message : 'Unknown error';
  resourceDao.updateResourceStatus(resource.id, 'error', errorMessage);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function triggerDownloadAsync(resource: Resource): void {
  setImmediate(() => {
    startDownload(resource).catch(err => {
      console.error('[ResourceDownloader] Unhandled error in background download:', err);
    });
  });
}

export function getFullPath(resource: Resource): string {
  return path.join(RESOURCES_DIR, resource.platform, `${resource.itemId}.mp4`);
}
