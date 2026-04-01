import { Request, Response } from 'express';
import { getMCPConfigByPlatform } from '../database/mcpConfigDao';
import { MCPClient } from '../services/mcpClient';
import type { TrendingVideo } from '../types';
import type { UnifiedSearchResult } from '../agents/hotSearchAgent';

export interface TrendingSearchRequestV2 {
  keyword: string;
  platforms: string[];
}

function parseXiaohongshuResult(item: any): UnifiedSearchResult | null {
  if (!item || !item.id || !item.noteCard) return null;

  const noteCard = item.noteCard;
  if (noteCard.type !== 'video') return null;

  const coverUrl = noteCard.cover?.urlDefault || noteCard.cover?.urlPre || '';

  return {
    id: String(item.id),
    platform: 'xiaohongshu',
    title: noteCard.displayTitle || '',
    description: '',
    coverUrl,
    imageUrls: coverUrl ? [coverUrl] : [],
    videoUrls: [],
    author: noteCard.user?.nickname || noteCard.user?.nickName || '',
    xsecToken: item.xsecToken,
    stats: {
      likes: parseInt(noteCard.interactInfo?.likedCount || '0', 10),
      comments: parseInt(noteCard.interactInfo?.commentCount || '0', 10),
      collects: parseInt(noteCard.interactInfo?.collectedCount || '0', 10),
    },
    publishTime: undefined,
    tags: [],
  };
}

function parseBilibiliResult(item: any): UnifiedSearchResult | null {
  if (!item || !item.bvid) return null;

  return {
    id: item.bvid,
    platform: 'bilibili',
    title: item.title || '',
    description: item.description || '',
    coverUrl: '/bili_logo.png',
    imageUrls: ['/bili_logo.png'],
    videoUrls: [],
    author: item.author || '',
    stats: {
      views: typeof item.play === 'number' ? item.play : parseInt(item.play || '0', 10),
    },
    publishTime: undefined,
    tags: [],
  };
}

function convertToTrendingVideo(unity: UnifiedSearchResult): TrendingVideo {
  let originalUrl: string | undefined;

  if (unity.platform === 'xiaohongshu') {
    originalUrl = `https://www.xiaohongshu.com/explore/${unity.id}?xsec_token=${unity.xsecToken}&source=pc_feed`;
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

function parseToolResult(content: any): any {
  if (!content) return null;

  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  if (Array.isArray(content) && content.length > 0 && content[0].type === 'text') {
    try {
      return JSON.parse(content[0].text);
    } catch {
      return null;
    }
  }

  return content;
}

export async function searchTrendingVideosV2(req: Request, res: Response) {
  try {
    const { keyword, platforms } = req.body as TrendingSearchRequestV2;
    console.log(`[TrendingSearchV2] Starting search: keyword="${keyword}", platforms=[${platforms.join(', ')}]`);

    const results: UnifiedSearchResult[] = [];

    for (const platform of platforms) {
      const mcpConfig = getMCPConfigByPlatform(platform as any);
      if (!mcpConfig || !mcpConfig.enabled) {
        console.log(`[TrendingSearchV2] Platform ${platform} not configured or disabled, skipping`);
        continue;
      }

      const client = new MCPClient({ serverUrl: mcpConfig.serverUrl });
      try {
        await client.connect();

        if (platform === 'xiaohongshu') {
          console.log(`[TrendingSearchV2] Calling xiaohongshu search_feeds...`);
          const toolResult = await client.callTool('search_feeds', {
            keyword,
            filters: {
              note_type: '视频',
              publish_time: '一周内',
              sort_by: '最多点赞',
            },
          });

          if (!toolResult.isError) {
            const parsed = parseToolResult(toolResult.content);
            if (parsed && Array.isArray(parsed.feeds)) {
              const xhsResults = parsed.feeds
                .map(parseXiaohongshuResult)
                .filter((r: any): r is UnifiedSearchResult => r !== null);
              results.push(...xhsResults);
              console.log(`[TrendingSearchV2] Got ${xhsResults.length} video results from xiaohongshu`);
            }
          } else {
            console.error(`[TrendingSearchV2] xiaohongshu search failed:`, toolResult.content);
          }
        } else if (platform === 'bilibili') {
          console.log(`[TrendingSearchV2] Calling bilibili bili_search...`);
          const toolResult = await client.callTool('bili_search', {
            keyword,
            num: 50,
            order: 'click',
          });

          if (!toolResult.isError) {
            const parsed = parseToolResult(toolResult.content);
            if (parsed && Array.isArray(parsed.videos)) {
              const biliResults = parsed.videos
                .map(parseBilibiliResult)
                .filter((r: any): r is UnifiedSearchResult => r !== null);
              results.push(...biliResults);
              console.log(`[TrendingSearchV2] Got ${biliResults.length} results from bilibili`);
            }
          } else {
            console.error(`[TrendingSearchV2] bilibili search failed:`, toolResult.content);
          }
        }

        await client.disconnect();
      } catch (error) {
        console.error(`[TrendingSearchV2] Failed to search on ${platform}:`, error);
        try {
          await client.disconnect();
        } catch {
        }
      }
    }

    console.log(`[TrendingSearchV2] Search completed, total ${results.length} results`);
    const trendingVideos: TrendingVideo[] = results.map(convertToTrendingVideo);

    console.log(`[TrendingSearchV2] Returning ${trendingVideos.length} results`);
    res.json({
      code: 0,
      message: 'success',
      data: trendingVideos,
    });
  } catch (error) {
    console.error('[TrendingSearchV2] Search failed:', error);
    res.status(500).json({
      code: 1,
      message: 'Search failed: ' + (error as Error).message,
    });
  }
}
