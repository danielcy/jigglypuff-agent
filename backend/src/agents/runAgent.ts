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

/**
 * Build the initial messages array with system prompt and user input
 */
function buildInitialMessages(
  agentDef: AgentDefinition,
  context: AgentContext,
  userInput: string
): AgentMessage[] {
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

  // Add the user input
  messages.push({
    role: 'user',
    content: userInput,
  });

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

  if (localTools.length === 0) {
    return [];
  }

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000);

  try {
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
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;
    const choice = data.choices[0];
    const msg = choice.message;

    console.log(`[Agent Debug] LLM response: has_content=${!!msg.content}, content_length=${msg.content?.length}, has_tool_calls=${!!msg.tool_calls}, tool_calls_count=${msg.tool_calls?.length}`);

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
      console.warn(`[Agent Debug] LLM returned empty content (no tool calls)`);
    }

    return {
      role: 'assistant',
      content: msg.content || '',
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Call a single tool
 */
async function callTool(
  toolName: string,
  args: Record<string, any>,
  availableTools: AgentAvailableTool[]
): Promise<any> {
  console.log(`[Agent Debug] Calling tool: ${toolName}, args=${JSON.stringify(args)}`);
  for (const { client, tools } of availableTools) {
    const found = tools.find(t => t.name === toolName);
    if (found) {
      const result = await client.callTool(toolName, args);
      console.log(`[Agent Debug] Tool ${toolName} completed: result length=${JSON.stringify(result).length} chars`);
      return result;
    }
  }
  console.error(`[Agent Debug] Tool ${toolName} not found in available tools`);
  throw new Error(`Tool ${toolName} not found in available tools`);
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
  }[]
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

  // Add the current user input AFTER loading existing history
  messages.push({
    role: 'user',
    content: userInput,
  });

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
        context.onStep(step + 1, content, !llmResponse.toolCalls);
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
          const result = await callTool(toolCall.name, toolCall.arguments, availableTools);
          messages.push({
            role: 'tool',
            content: JSON.stringify(result),
            toolCallId: toolCall.id,
            name: toolCall.name,
          });
          // Send tool result
          if (context.onStep) {
            context.onStep(step + 1, `工具 ${toolCall.name} 执行完成`, true);
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
            context.onStep(step + 1, `工具 ${toolCall.name} 执行失败: ${(error as Error).message}`, true);
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
      context.onStep(maxTurns, `已达到最大步骤数限制 (${maxTurns})`, true);
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
