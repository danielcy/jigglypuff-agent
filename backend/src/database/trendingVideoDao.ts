import { db } from './db';
import type { TrendingVideo } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function getAllTrendingVideos(): TrendingVideo[] {
  const rows = db.prepare('SELECT * FROM trending_videos ORDER BY addedAt DESC').all() as any[];
  return rows.map((row: any) => ({
    id: row.id as string,
    platform: row.platform as 'bilibili' | 'xiaohongshu',
    title: row.title as string,
    author: row.author as string,
    coverUrl: row.cover_url as string,
    videoUrl: row.video_url as string,
    views: row.views as number,
    likes: row.likes as number,
    publishTime: row.publish_time ? new Date(row.publish_time as string) : undefined,
    tags: row.tags ? (row.tags as string).split(',') : [],
    description: row.description as string,
    addedAt: new Date(row.added_at as string),
  }));
}

export function createTrendingVideo(video: Omit<TrendingVideo, 'id' | 'addedAt'>): TrendingVideo {
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO trending_videos (id, platform, title, author, cover_url, video_url, views, likes, publish_time, tags, description, added_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    video.platform,
    video.title,
    video.author,
    video.coverUrl,
    video.videoUrl,
    video.views,
    video.likes,
    video.publishTime ? video.publishTime.toISOString() : null,
    video.tags ? video.tags.join(',') : null,
    video.description || null,
    now
  );

  return {
    id,
    ...video,
    addedAt: new Date(now),
  };
}

export function deleteTrendingVideo(id: string): boolean {
  const result = db.prepare('DELETE FROM trending_videos WHERE id = ?').run(id);
  return result.changes > 0;
}
