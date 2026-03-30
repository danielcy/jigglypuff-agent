import { getMCPConfigByPlatform } from '../database/mcpConfigDao';
import { MCPClient } from './mcpClient';
import type { UnifiedSearchResult, XiaohongshuDetail } from '../agents/hotSearchAgent';

export interface processedXiaohongshuResult extends UnifiedSearchResult {
  xhsDetail?: XiaohongshuDetail;
}

export async function processXiaohongshuResults(results: UnifiedSearchResult[]): Promise<UnifiedSearchResult[]> {
  const xhsResults = results.filter(r => r.platform === 'xiaohongshu' && r.xsecToken);
  
  if (xhsResults.length === 0) {
    return results;
  }

  const mcpConfig = getMCPConfigByPlatform('xiaohongshu');
  if (!mcpConfig || !mcpConfig.enabled) {
    console.log('[XiaohongshuPostProcessor] Xiaohongshu MCP not configured or disabled, skipping post-processing');
    return results;
  }

  let client: MCPClient | null = null;
  try {
    client = new MCPClient({ serverUrl: mcpConfig.serverUrl });
    await client.connect();
    
    console.log(`[XiaohongshuPostProcessor] Starting concurrent detail fetch for ${xhsResults.length} results`);
    
    const fetchPromises = xhsResults.map(async (result) => {
      try {
        const detail = await fetchXiaohongshuDetail(client!, result.id, result.xsecToken!);
        if (detail) {
          result.xhsDetail = detail;
          
          if (detail.interactInfo?.collectedCount) {
            result.stats.collects = parseInt(detail.interactInfo.collectedCount, 10) || 0;
          }
          if (detail.interactInfo?.likedCount && !result.stats.likes) {
            result.stats.likes = parseInt(detail.interactInfo.likedCount, 10) || 0;
          }
          if (detail.interactInfo?.commentCount && !result.stats.comments) {
            result.stats.comments = parseInt(detail.interactInfo.commentCount, 10) || 0;
          }
          
          if (!result.description && detail.desc) {
            result.description = detail.desc;
          }
          
          if (detail.imageList && detail.imageList.length > 0 && result.imageUrls.length === 0) {
            result.imageUrls = detail.imageList.map(img => img.urlDefault);
            if (!result.coverUrl) {
              result.coverUrl = detail.imageList[0].urlDefault;
            }
          }
          
          console.log(`[XiaohongshuPostProcessor] Successfully fetched detail for note ${result.id}`);
        }
      } catch (error) {
        console.error(`[XiaohongshuPostProcessor] Failed to fetch detail for note ${result.id}:`, error);
      }
      return result;
    });

    await Promise.allSettled(fetchPromises);
    
    console.log(`[XiaohongshuPostProcessor] Completed post-processing, ${xhsResults.length} results processed`);
    
    return results;
  } catch (error) {
    console.error('[XiaohongshuPostProcessor] Failed to initialize MCP client:', error);
    return results;
  } finally {
    if (client) {
      try {
        await client.disconnect();
      } catch (error) {
        console.error('[XiaohongshuPostProcessor] Failed to disconnect client:', error);
      }
    }
  }
}

async function fetchXiaohongshuDetail(
  client: MCPClient,
  feedId: string,
  xsecToken: string
): Promise<XiaohongshuDetail | null> {
  try {
    const result = await client.callTool('get_feed_detail', {
      feed_id: feedId,
      xsec_token: xsecToken,
    });

    if (result.isError) {
      console.error(`[XiaohongshuPostProcessor] Tool call error for ${feedId}:`, result.content);
      return null;
    }

    const parsed = parseToolResult(result.content);
    if (!parsed || !parsed.data || !parsed.data.note) {
      console.warn(`[XiaohongshuPostProcessor] No data in response for ${feedId}`);
      return null;
    }

    const note = parsed.data.note;
    
    return {
      noteId: note.noteId || feedId,
      xsecToken: note.xsecToken || xsecToken,
      desc: note.desc || '',
      type: note.type || '',
      ipLocation: note.ipLocation || '',
      user: {
        userId: note.user?.userId || '',
        nickname: note.user?.nickname || note.user?.nickName || '',
        avatar: note.user?.avatar || '',
      },
      interactInfo: {
        likedCount: note.interactInfo?.likedCount || '0',
        sharedCount: note.interactInfo?.sharedCount || '0',
        commentCount: note.interactInfo?.commentCount || '0',
        collectedCount: note.interactInfo?.collectedCount || '0',
      },
      imageList: Array.isArray(note.imageList) 
        ? note.imageList.map((img: any) => ({
            width: img.width || 0,
            height: img.height || 0,
            urlDefault: img.urlDefault || '',
            urlPre: img.urlPre || '',
          }))
        : [],
    };
  } catch (error) {
    console.error(`[XiaohongshuPostProcessor] Error fetching detail for ${feedId}:`, error);
    return null;
  }
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
