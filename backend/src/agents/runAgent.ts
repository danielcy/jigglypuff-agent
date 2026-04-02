/**
 * @fileoverview Core Agent Execution Loop
 * This is the main executor that:
 * 1. Initializes the agent
 * 2. Connects MCP servers
 * 3. Runs the LLM -> tool call -> LLM loop
 * 4. Cleans up resources
 * 5. Returns the result
 */

import type { AgentDefinition, AgentContext, AgentResult, AgentMessage, AgentToolCall } from './types';
import type { AgentAvailableTool } from './baseAgent';
import { executeCleanup } from './utils/cleanup';
import toolRegistry from '../tools/toolRegistry';
import { LocalToolClient } from '../tools/localToolClient';
import type { LLMConfig } from '../types';
import type { Tool } from '../types';
import { convertAttachmentToBase64 } from '../utils/fileUtils';

/**
 * Build the initial messages array with system prompt and user input
 */
async function buildInitialMessages(
  agentDef: AgentDefinition,
  context: AgentContext,
  userInput: string,
  attachments?: any[]
): Promise<AgentMessage[]> {
  const systemPrompt = typeof agentDef.systemPrompt === 'function'
    ? agentDef.systemPrompt()
    : agentDef.systemPrompt;

  const messages: AgentMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ];

  // Add dynamic system prompt if agent has custom getter
  if (agentDef.getSystemPrompt) {
    messages.push({
      role: 'system',
      content: agentDef.getSystemPrompt(context),
    });
  }

  // Add the user input with attachments (if any)
  if (attachments && attachments.length > 0) {
    const content: any[] = [
      { type: 'text', text: userInput }
    ];

    // Convert attachments to base64 before sending to LLM
    const convertedAttachments = await Promise.all(
      attachments.map(convertAttachmentToBase64)
    );

    for (const attachment of convertedAttachments) {
      if (attachment.type === 'image') {
        content.push({
          type: 'image_url',
          image_url: {
            url: attachment.url
          }
        });
        content.push({
          type: 'text',
          text: `参考图片【${attachment.name}】: ${attachment.metadata.imageUrl}`
        });
      } else if (attachment.type === 'video') {
        content.push({
          type: 'video_url', // 目前大多数大模型使用 video_url 类型处理视频
          video_url: {
            url: attachment.url
          }
        });
        content.push({
          type: 'text',
          text: `参考视频【${attachment.name}】: ${attachment.metadata.videoUrl}`
        });
      }
    }

    messages.push({
      role: 'user',
      content: content,
    });
  } else {
    // 没有附件时保持原样
    messages.push({
      role: 'user',
      content: userInput,
    });
  }

  return messages;
}

/**
 * Build available tools array from allowed tools
 */
function buildAvailableTools(context: AgentContext): AgentAvailableTool[] {
  // Local tools (our own tool implementation)
  const localTools = toolRegistry
    .getAllTools()
    .filter(tool => context.allowedTools.has(tool.name));

  const client = new LocalToolClient(async (toolName: string, args: Record<string, any>) => {
    const foundTool = toolRegistry.getTool(toolName);
    if (!foundTool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    return foundTool.execute(args, context.creation, context);
  });

  return [
    {
      client: client as unknown as import('../services/mcpClient').MCPClient,
      tools: localTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    },
  ];
}

/**
 * Call LLM with current messages
 */
async function callLLM(
  llmConfig: LLMConfig,
  messages: AgentMessage[],
  availableTools: AgentAvailableTool[]
): Promise<AgentMessage> {
  const allTools = availableTools.reduce(
    (acc, item) => [...acc, ...item.tools],
    [] as Tool[]
  );

  console.log(`[Agent Debug] Calling LLM: messages=${messages.length}, tools=${allTools.length}`);

  // Convert to OpenAI compatible format
  const openAIMessages = messages.map(msg => {
    if (msg.role === 'tool') {
      return {
        role: 'tool',
        content: msg.content,
        tool_call_id: msg.toolCallId,
        name: msg.name,
      } as const;
    }
    if (msg.role === 'assistant' && msg.toolCalls) {
      return {
        role: 'assistant',
        content: msg.content,
        tool_calls: msg.toolCalls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        } as const)),
      } as const;
    }
    // 新增: 支持 content 为数组 (多模态)
    if (Array.isArray(msg.content)) {
      return {
        role: msg.role,
        content: msg.content,
      } as const;
    }
    return {
      role: msg.role,
      content: msg.content,
    } as const;
  });

  const body: any = {
    model: llmConfig.modelName,
    messages: openAIMessages,
    max_tokens: llmConfig.maxTokens ?? 32000,
  };

  if (allTools.length > 0) {
    body.tools = allTools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: tool.inputSchema,
      },
    } as const));
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let retry = 0; retry < maxRetries; retry++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);

    try {
      console.log(`[Agent Debug] LLM attempt ${retry + 1}/${maxRetries}`);

      const response = await fetch(
        `${llmConfig.baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${llmConfig.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json() as any;
      const choice = data.choices[0];
      const msg = choice.message;

      console.log(`[Agent Debug] LLM response (attempt ${retry + 1}): has_content=${!!msg.content}, content_length=${msg.content?.length}, has_tool_calls=${!!msg.tool_calls}, tool_calls_count=${msg.tool_calls?.length}`);

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        return {
          role: 'assistant',
          content: msg.content || '',
          toolCalls: msg.tool_calls.map((tc: any) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
          })),
        };
      }

      if (!msg.content || msg.content.trim().length === 0) {
        console.warn(`[Agent Debug] LLM returned empty content (no tool calls) on attempt ${retry + 1}`);
      }

      return {
        role: 'assistant',
        content: msg.content || '',
      };
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error as Error;
      console.error(`[Agent Debug] LLM attempt ${retry + 1} failed: ${lastError.message}`);

      // If not last retry, wait a bit before retrying
      if (retry < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
      }
    }
  }

  // All retries failed
  throw lastError!;
}

/**
 * Call a single tool
 */
async function callTool(
  toolName: string,
  args: Record<string, any>,
  availableTools: AgentAvailableTool[],
  messages: AgentMessage[]
): Promise<any> {
  console.log(`[Agent Debug] Calling tool: ${toolName}, args=${JSON.stringify(args)}`);
  for (const { client, tools } of availableTools) {
    const found = tools.find(t => t.name === toolName);
    if (found) {
      const result = await client.callTool(toolName, args);
      console.log(`[Agent Debug] Tool ${toolName} completed: result length=${JSON.stringify(result).length} chars`);
      // If tool returns subagentMessages (fork_subagent), push them all to messages so they are saved to chatHistory
      const resultWithSubagent = result as { subagentMessages?: Array<{
        role: string;
        content: string;
        toolName?: string;
        toolArgs?: Record<string, any>;
        toolCallId?: string;
      }> };
      if (resultWithSubagent.subagentMessages && Array.isArray(resultWithSubagent.subagentMessages)) {
        console.log(`[Agent Debug] Tool ${toolName} returning ${resultWithSubagent.subagentMessages.length} subagent messages, adding to chatHistory`);
        resultWithSubagent.subagentMessages.forEach((msg: {
          role: string;
          content: string;
          toolName?: string;
          toolArgs?: Record<string, any>;
          toolCallId?: string;
        }) => {
          let toolCalls: AgentToolCall[] | undefined;
          if (msg.toolName && msg.toolArgs) {
            toolCalls = [{
              id: Date.now().toString() + Math.random(),
              name: msg.toolName,
              arguments: msg.toolArgs,
            }];
          }
          messages.push({
            role: msg.role as any,
            content: msg.content,
            name: msg.toolName,
            toolCalls,
            toolCallId: msg.toolCallId,
          });
        });
      }
      return result;
    }
  }
  console.error(`[Agent Debug] Tool ${toolName} not found in available tools`);
  throw new Error(`Tool ${toolName} not found`);
}

/**
 * Core agent execution loop
 */
export async function runAgent(
  agentDef: AgentDefinition,
  context: AgentContext,
  userInput: string,
  existingChatHistory?: {
    role: string;
    content: string;
    toolName?: string;
    toolArgs?: Record<string, any>;
  }[],
  attachments?: any[]
): Promise<AgentResult> {
  const maxTurns = agentDef.maxTurns ?? 50;
  console.log(`[Agent Debug] Starting agent: ${agentDef.agentType}, maxTurns=${maxTurns}`);

  // Start with empty messages
  const messages: AgentMessage[] = [];

  // Add system prompt first
  const systemPrompt = typeof agentDef.systemPrompt === 'function'
    ? agentDef.systemPrompt()
    : agentDef.systemPrompt;

  messages.push({
    role: 'system',
    content: systemPrompt,
  });

  // Add dynamic system prompt if agent has custom getter
  if (agentDef.getSystemPrompt) {
    messages.push({
      role: 'system',
      content: agentDef.getSystemPrompt(context),
    });
  }

  // Load existing chat history from creation - convert ChatMessage to AgentMessage
  if (existingChatHistory && existingChatHistory.length > 0) {
    existingChatHistory.forEach(msg => {
      if (msg.role === 'system') return; // Skip system messages, already have system prompt

      if (msg.role === 'tool' && msg.toolName) {
        // Tool message - convert to AgentMessage
        messages.push({
          role: 'tool',
          content: msg.content,
          toolCallId: msg.toolName ? Date.now().toString() + Math.random() : undefined,
          name: msg.toolName,
        });
      } else if (msg.role === 'assistant' && msg.toolName && msg.toolArgs) {
        // Assistant message with tool call
        messages.push({
          role: 'assistant',
          content: msg.content,
          toolCalls: [{
            id: Date.now().toString(),
            name: msg.toolName,
            arguments: msg.toolArgs,
          }],
        });
      } else {
        // Regular user/assistant message
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    });
  }

  // Add the current user input AFTER loading existing history - use buildInitialMessages to handle attachments
  const initialMessages = await buildInitialMessages(agentDef, context, userInput, attachments);
  // 只添加最后一个用户消息，因为前面的系统提示已经添加过了
  const lastMessage = initialMessages[initialMessages.length - 1];
  if (lastMessage) {
    messages.push(lastMessage);
  }

  // Record the initial message count before starting execution - only new messages will be returned
  const initialMessagesLength = messages.length;

  const availableTools = buildAvailableTools(context);

  try {
    // Execute loop
    for (let step = 0; step < maxTurns; step++) {
      // Check if aborted
      if (context.abortController.signal.aborted) {
        throw new Error('Agent execution aborted');
      }

      console.log(`[Agent Debug] Step ${step + 1}/${maxTurns} starting`);

      // Call LLM
      const llmResponse = await callLLM(context.llmConfig, messages, availableTools);
      messages.push(llmResponse);

      // Send step update
      if (context.onStep) {
        let content = '';
        if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
          content = `正在调用工具: ${llmResponse.toolCalls.map(tc => tc.name).join(', ')}`;
        } else {
          content = llmResponse.content as string;
        }
        context.onStep(step + 1, { type: 'assistant_text', content }, !llmResponse.toolCalls);
        // Yield to event loop to allow SSE buffer to flush
        await new Promise(resolve => setImmediate(resolve));
      }

      // If no tool calls, we're done
      if (!llmResponse.toolCalls || llmResponse.toolCalls.length === 0) {
        console.log(`[Agent Debug] Execution finished: no more tool calls needed`);

        // Cleanup
        await executeCleanup(context.cleanupHooks);

        // Only return newly generated messages (after initial messages + existing chat history)
        const newMessages = messages.slice(initialMessagesLength);

        return {
          success: true,
          messages: newMessages,
          finalAnswer: llmResponse.content as string,
        };
      }

      // Execute each tool call
      for (const toolCall of llmResponse.toolCalls) {
        try {
          const result = await callTool(toolCall.name, toolCall.arguments, availableTools, messages);
          messages.push({
            role: 'tool',
            content: JSON.stringify(result),
            toolCallId: toolCall.id,
            name: toolCall.name,
          });
          // Send tool result
          if (context.onStep) {
            context.onStep(step + 1, { type: 'assistant_text', content: `工具 ${toolCall.name} 执行完成` }, true);
            // Yield to event loop to allow SSE buffer to flush
            await new Promise(resolve => setImmediate(resolve));
          }
        } catch (error) {
          console.error(`[Agent Debug] Tool call failed: ${toolCall.name}, error=${(error as Error).message}`);
          messages.push({
            role: 'tool',
            content: `Error: ${(error as Error).message}`,
            toolCallId: toolCall.id,
            name: toolCall.name,
          });
          if (context.onStep) {
            context.onStep(step + 1, { type: 'assistant_text', content: `工具 ${toolCall.name} 执行失败: ${(error as Error).message}` }, true);
            // Yield to event loop to allow SSE buffer to flush
            await new Promise(resolve => setImmediate(resolve));
          }
        }
      }

      console.log(`[Agent Debug] Step ${step + 1} completed`);
    }

    // Reached max turns
    console.warn(`[Agent Debug] Reached maximum steps limit: ${maxTurns}`);
    if (context.onStep) {
      context.onStep(maxTurns, { type: 'assistant_text', content: `已达到最大步骤数限制 (${maxTurns})` }, true);
      await new Promise(resolve => setImmediate(resolve));
    }

    await executeCleanup(context.cleanupHooks);

    // Only return newly generated messages
    const newMessages = messages.slice(initialMessagesLength);

    return {
      success: true,
      messages: newMessages,
      finalAnswer: `Reached maximum steps (${maxTurns})`,
    };
  } catch (error) {
    console.error(`[Agent Debug] Agent execution failed:`, error);
    // Cleanup even on error
    await executeCleanup(context.cleanupHooks);

    // Only return newly generated messages
    const newMessages = messages.slice(initialMessagesLength);

    return {
      success: false,
      messages: newMessages,
      error: (error as Error).message,
    };
  }
}
