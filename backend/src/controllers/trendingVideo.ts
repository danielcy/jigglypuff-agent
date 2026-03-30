import { Request, Response } from 'express';
import * as trendingVideoDao from '../database/trendingVideoDao';
import type { TrendingVideo } from '../types';
import HotSearchAgent, { UnifiedSearchResult } from '../agents/hotSearchAgent';

export interface TrendingSearchRequest {
  keyword: string;
  platforms: string[];
}

function convertToTrendingVideo(unity: UnifiedSearchResult): TrendingVideo {
  let originalUrl: string | undefined;
  
  if (unity.platform === 'xiaohongshu') {
    originalUrl = `https://www.xiaohongshu.com/explore/${unity.id}`;
  } else if (unity.platform === 'bilibili') {
    originalUrl = `https://www.bilibili.com/video/${unity.id}`;
  }
  
  return {
    id: unity.id,
    platform: unity.platform,
    title: unity.title,
    author: unity.author,
    coverUrl: unity.coverUrl,
    videoUrl: unity.videoUrls[0] || '',
    originalUrl,
    views: unity.stats.views || 0,
    likes: unity.stats.likes || 0,
    collects: unity.stats.collects,
    publishTime: unity.publishTime,
    tags: unity.tags,
    description: unity.description,
    addedAt: new Date(),
  };
}

export async function searchTrendingVideos(req: Request, res: Response) {
  try {
    const { keyword, platforms } = req.body as TrendingSearchRequest;

    const createResult = await HotSearchAgent.create(keyword, platforms);
    if (!createResult.success) {
      return res.status(400).json({ error: createResult.error });
    }

    const agent = createResult.agent;
    const result = await agent.run(`搜索关键词: ${keyword}`);

    if (!result.finalAnswer) {
      return res.json([]);
    }

    const unifiedResults = HotSearchAgent.parseFinalResult(result.finalAnswer);
    console.log(`[TrendingSearch] Parsed ${unifiedResults.length} results from agent`);
    const results: TrendingVideo[] = unifiedResults.map(convertToTrendingVideo);

    console.log(`[TrendingSearch] Returning ${results.length} results`);
    res.json(results);
  } catch (error) {
    console.error('Search failed:', error);
    res.status(500).json({ error: 'Search failed: ' + (error as Error).message });
  }
}

export function getAllTrendingVideos(req: Request, res: Response) {
  const videos = trendingVideoDao.getAllTrendingVideos();
  res.json(videos);
}
