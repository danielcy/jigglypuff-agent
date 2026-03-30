import { BaseAgent, AgentConfig, AgentStepResult } from './baseAgent';
import { getDefaultLLMConfig } from '../database/llmConfigDao';
import { getMCPConfigByPlatform } from '../database/mcpConfigDao';
import { MCPClient } from '../services/mcpClient';
import type { LLMConfig } from '../types';
import type { Tool } from '../types';

export interface UnifiedSearchResult {
  id: string;
  platform: 'bilibili' | 'xiaohongshu';
  title: string;
  description: string;
  coverUrl: string;
  imageUrls: string[];
  videoUrls: string[];
  author: string;
  xsecToken?: string;
  stats: {
    views?: number;
    likes?: number;
    comments?: number;
    collects?: number;
  };
  publishTime?: Date;
  tags: string[];
  xhsDetail?: XiaohongshuDetail;
}

export interface XiaohongshuDetail {
  noteId: string;
  xsecToken: string;
  desc: string;
  type: string;
  ipLocation: string;
  user: {
    userId: string;
    nickname: string;
    avatar: string;
  };
  interactInfo: {
    likedCount: string;
    sharedCount: string;
    commentCount: string;
    collectedCount: string;
  };
  imageList: Array<{
    width: number;
    height: number;
    urlDefault: string;
    urlPre: string;
  }>;
}

export class HotSearchAgent extends BaseAgent {
  private targetPlatforms: string[];

  constructor(llmConfig: LLMConfig, targetPlatforms: string[]) {
    const systemPrompt = [
      '# 角色定位',
      '你是一个专业的爆款内容搜索专家，精通在B站和小红书搜索热门爆款内容。你的任务是根据用户提供的关键词，在指定平台上搜索相关内容，并整理成标准化的JSON格式输出。',
      '',
      '# 核心工作流程',
      '1. **理解搜索需求**：分析用户提供的关键词和搜索目标',
      '2. **选择正确工具**：根据目标平台，调用对应平台的搜索工具',
      '3. **执行搜索**：使用搜索工具获取内容数据',
      '4. **整理结果**：将搜索结果整理成要求的JSON格式',
      '5. **输出结果**：只输出纯净的JSON，不要任何其他内容',
      '',
      '# 搜索策略',
      '- 如果用户没有指定具体平台，在所有可用平台上进行搜索',
      '- 优先使用平台提供的搜索功能获取相关热门内容',
      '- 如果一次搜索返回结果不够，可以尝试不同的搜索词',
      '- 根据用户需求合理使用筛选条件，提高搜索结果质量',
      '- 只保留真实存在的内容数据，不要编造或想象',
      '',
      '# 工具使用说明',
      '',
      '## 小红书 (xiaohongshu)',
      '使用 search_feeds 工具搜索小红书内容：',
      '- **必需参数**：',
      '  - keyword: 搜索关键词',
      '- **可选参数 - filters**（筛选选项对象）：',
      '  - sort_by: 排序，默认 综合，可选值：',
      '    - 综合 - 综合排序',
      '    - 最新 - 按最新发布排序',
      '    - 最多点赞 - 按点赞数排序',
      '    - 最多评论 - 按评论数排序',
      '    - 最多收藏 - 按收藏数排序',
      '  - note_type: 笔记类型，默认 不限，可选值：（必填：视频）',
      '    - 视频 - 只看视频笔记',
      '  - publish_time: 发布时间范围，默认 不限，可选值：',
      '    - 不限 - 所有时间',
      '    - 一天内 - 只看一天内发布',
      '    - 一周内 - 只看一周内发布',
      '    - 半年内 - 只看半年内发布',
      '  - search_scope: 搜索范围，默认 不限，可选值：',
      '    - 不限 - 全部内容',
      '    - 已看过 - 只看已看过',
      '    - 未看过 - 只看未看过',
      '    - 已关注 - 只看已关注作者',
      '',
      '根据用户需求合理设置筛选参数，例如用户要找"最近一周AI热门笔记"，就应该设置 publish_time: "一周内" 和 sort_by: "最多点赞"。',
      '',
      '## B站 (bilibili)',
      '使用 bili_search 工具搜索B站视频：',
      '- **必需参数**：',
      '  - keyword: 搜索关键词',
      '- **可选参数**：',
      '  - order: 排序方式，默认 totalrank，可选值：',
      '    - totalrank - 综合排序',
      '    - click - 按播放量排序',
      '    - pubdate - 按最新发布排序',
      '    - dm - 按弹幕数排序',
      '',
      '根据用户需求选择合适的排序方式，例如用户要找"播放量最高的AI教程"，就应该设置 order: "click"。',
      '',
      '# 输出格式严格要求',
      '你必须严格按照以下JSON格式输出结果，严禁添加任何解释、思考过程、markdown标记或其他文字。',
      '',
      '最终输出必须是一个纯净、合法的JSON对象，格式如下：',
      '',
      '{',
      '  "results": [',
      '    {',
      '      "id": "内容ID字符串",',
      '      "platform": "bilibili 或 xiaohongshu",',
      '      "title": "内容标题",',
      '      "description": "内容描述或简介",',
      '      "coverUrl": "封面图片URL",',
      '      "imageUrls": ["所有图片URL组成的数组"],',
      '      "videoUrls": ["所有视频URL组成的数组"],',
      '      "author": "作者名称",',
      '      "xsecToken": "小红书笔记的xsecToken（可选）",',
      '      "stats": {',
      '        "views": 浏览量（可选，数字类型）,',
      '        "likes": 点赞数（可选，数字类型）,',
      '        "comments": 评论数（可选，数字类型）',
      '      },',
      '      "publishTime": "发布时间ISO字符串（可选）",',
      '      "tags": ["标签1", "标签2"]',
      '    }',
      '  ]',
      '}',
      '',
      '# 强制规则',
      '1. **必须输出合法JSON**：输出必须是100%符合JSON语法规范，可以直接被JSON.parse解析',
      '2. **只输出JSON**：输出开始于{，结束于}，前后不能有任何其他文字',
      '3. **字段完整**：每个结果必须包含上述所有字段，可选字段如果没有数据可以留空或省略',
      '4. **数据真实**：所有内容必须来自工具返回的真实数据，严禁编造',
      '5. **平台正确**：platform字段只能是 "bilibili" 或 "xiaohongshu"',
      '6. **数组格式**：imageUrls 和 videoUrls 必须是数组，即使只有一个元素也必须用数组',
      '7. **类型正确**：stats中的数字必须是数字类型，不能是字符串',
      '8. **无结果处理**：如果搜索没有结果，输出 {"results": []}',
      '9. **小红书相关**：在搜索小红书笔记时，必须填 note_type: "视频", publish_time: "一周内"',
      '',
      '# 错误处理',
      '- 如果工具调用失败，继续尝试其他可用工具或平台',
      '- 如果所有搜索都失败，输出 {"results": []}',
      '- 不要用自然语言描述错误，只输出规定的JSON格式',
      '',
      '记住：你的唯一输出就是符合规范的JSON，除此之外什么都不要写。开始工作吧！',
     ].join('\n');

    const config: AgentConfig = {
      llmConfig,
      systemPrompt,
      availableTools: [],
      maxSteps: 10,
    };

    super(config);
    this.targetPlatforms = targetPlatforms;
  }

  async run(userInput: string): Promise<AgentStepResult> {
    console.log(`[HotSearchAgent] Starting search: userInput=${userInput}`);
    this.addMessage({
      role: 'user',
      content: userInput,
    });

    const availableTools = await this.initAvailableTools();
    (this as any).availableTools = availableTools;
    console.log(`[HotSearchAgent] Available tools initialized: ${availableTools.length} platforms, total tools=${availableTools.reduce((sum, item) => sum + item.tools.length, 0)}`);

    const result = await this.executeLoop();
    await this.cleanup();
    console.log(`[HotSearchAgent] Search completed: hasFinalAnswer=${!!result.finalAnswer}`);

    return result;
  }

  private async initAvailableTools(): Promise<{ client: MCPClient; tools: Tool[] }[]> {
    const result: { client: MCPClient; tools: Tool[] }[] = [];

    for (const platform of this.targetPlatforms) {
      const mcpConfig = getMCPConfigByPlatform(platform);
      if (!mcpConfig || !mcpConfig.enabled) {
        continue;
      }

      try {
        const client = new MCPClient({ serverUrl: mcpConfig.serverUrl });
        const toolsResult = await client.listTools();
        result.push({
          client,
          tools: toolsResult.tools,
        });
      } catch (error) {
        console.error(`Failed to initialize tools for ${platform}:`, error);
      }
    }

    return result;
  }

  private async cleanup(): Promise<void> {
    const availableTools = (this as any).availableTools as { client: MCPClient; tools: Tool[] }[];
    for (const { client } of availableTools) {
      try {
        await client.disconnect();
      } catch (error) {
        console.error('Failed to disconnect client:', error);
      }
    }
  }

  static async create(
    keyword: string,
    platforms: string[]
  ): Promise<{ success: true; agent: HotSearchAgent } | { success: false; error: string }> {
    const llmConfig = getDefaultLLMConfig();
    if (!llmConfig) {
      return {
        success: false,
        error: '未配置默认大模型，请先在设置中配置默认LLM',
      };
    }

    const targetPlatforms = platforms.length > 0 ? platforms : ['bilibili', 'xiaohongshu'];
    const agent = new HotSearchAgent(llmConfig, targetPlatforms);

    return {
      success: true,
      agent,
    };
  }

  static parseFinalResult(finalAnswer: string): UnifiedSearchResult[] {
    try {
      console.log(`[HotSearchAgent] Parsing final result: length=${finalAnswer.length}`);

      let jsonStr = finalAnswer.trim();

      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');

      const data = JSON.parse(jsonStr);

      if (!data || !Array.isArray(data.results)) {
        console.warn('[HotSearchAgent] No results array found in parsed JSON');
        return [];
      }

      const results = data.results.map((item: any) => ({
        id: String(item.id || Date.now() + Math.random()),
        platform: item.platform as 'bilibili' | 'xiaohongshu',
        title: item.title || '',
        description: item.description || '',
        coverUrl: item.coverUrl || '',
        imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls : [],
        videoUrls: Array.isArray(item.videoUrls) ? item.videoUrls : [],
        author: item.author || '',
        xsecToken: item.xsecToken,
        stats: item.stats || {},
        publishTime: item.publishTime ? new Date(item.publishTime) : undefined,
        tags: Array.isArray(item.tags) ? item.tags : [],
      }));

      console.log(`[HotSearchAgent] Parsed ${results.length} results successfully`);
      return results;
    } catch (error) {
      console.error('Failed to parse final result:', error);
      console.error('Raw final answer:', finalAnswer);
      return [];
    }
  }
}

export default HotSearchAgent;
