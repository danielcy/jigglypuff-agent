import type { LLMConfig } from '../types';
import type { MCPClient } from '../services/mcpClient';
import type { Tool } from '../types';

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: AgentToolCall[];
  toolCallId?: string;
  name?: string;
}

export interface AgentToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface AgentStepResult {
  shouldStop: boolean;
  finalAnswer?: string;
  messages: AgentMessage[];
}

export interface AgentConfig {
  llmConfig: LLMConfig;
  systemPrompt: string;
  availableTools: AgentAvailableTool[];
  maxSteps?: number;
}

export interface AgentAvailableTool {
  client: MCPClient;
  tools: Tool[];
}

export abstract class BaseAgent {
  protected llmConfig: LLMConfig;
  protected systemPrompt: string;
  protected availableTools: AgentAvailableTool[];
  protected maxSteps: number;
  protected messages: AgentMessage[];

  constructor(config: AgentConfig) {
    this.llmConfig = config.llmConfig;
    this.systemPrompt = config.systemPrompt;
    this.availableTools = config.availableTools;
    this.maxSteps = config.maxSteps || 100;
    this.messages = [];

    this.messages.push({
      role: 'system',
      content: this.systemPrompt,
    });
  }

  abstract run(userInput: string): Promise<AgentStepResult>;

  protected getAllTools(): Tool[] {
    return this.availableTools.reduce((acc, item) => [...acc, ...item.tools], [] as Tool[]);
  }

  protected async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    console.log(`[Agent Debug] Calling tool: ${toolName}, args=${JSON.stringify(args)}`);
    for (const { client, tools } of this.availableTools) {
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

  protected addMessage(message: AgentMessage): void {
    this.messages.push(message);
  }

  protected getMessages(): AgentMessage[] {
    return this.messages;
  }

  protected async callLLM(): Promise<AgentMessage> {
    const messages = this.getMessages();
    const tools = this.getAllTools();
    console.log(`[Agent Debug] Calling LLM: messages=${messages.length}, tools=${tools.length}`);
    const response = await this.fetchLLMResponse(messages, tools);
    console.log(`[Agent Debug] LLM response received: hasToolCalls=${!!response.toolCalls && response.toolCalls.length > 0}`);
    if (response.toolCalls && response.toolCalls.length > 0) {
      console.log(`[Agent Debug] LLM requested tool calls: ${response.toolCalls.map(tc => tc.name).join(', ')}`);
    } else {
      console.log(`[Agent Debug] LLM provided final answer: ${response.content?.slice(0, 100)}...`);
    }
    return response;
  }

  private async fetchLLMResponse(messages: AgentMessage[], tools: Tool[]): Promise<AgentMessage> {
    const openAICompatibleMessages = messages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          content: msg.content,
          tool_call_id: msg.toolCallId,
          name: msg.name,
        };
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
          })),
        };
      }
      return {
        role: msg.role,
        content: msg.content,
      };
    });

    const body: any = {
      model: this.llmConfig.modelName,
      messages: openAICompatibleMessages,
      max_tokens: this.llmConfig.maxTokens ?? 32000,
    };

    if (tools.length > 0) {
      body.tools = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description || '',
          parameters: tool.inputSchema,
        },
      }));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);

    try {
      const response = await fetch(`${this.llmConfig.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.llmConfig.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json() as any;
      const choice = data.choices[0];
      const msg = choice.message;

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

      return {
        role: 'assistant',
        content: msg.content || '',
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  protected async executeLoop(): Promise<AgentStepResult> {
    console.log(`[Agent Debug] Starting execution loop: maxSteps=${this.maxSteps}`);
    for (let step = 0; step < this.maxSteps; step++) {
      console.log(`[Agent Debug] Step ${step + 1}/${this.maxSteps} starting`);
      const llmResponse = await this.callLLM();
      this.addMessage(llmResponse);

      if (!llmResponse.toolCalls || llmResponse.toolCalls.length === 0) {
        console.log(`[Agent Debug] Execution finished: no more tool calls needed`);
        return {
          shouldStop: true,
          finalAnswer: llmResponse.content,
          messages: this.messages,
        };
      }

      for (const toolCall of llmResponse.toolCalls) {
        try {
          const result = await this.callTool(toolCall.name, toolCall.arguments);
          this.addMessage({
            role: 'tool',
            content: JSON.stringify(result),
            toolCallId: toolCall.id,
            name: toolCall.name,
          });
        } catch (error) {
          console.error(`[Agent Debug] Tool call failed: ${toolCall.name}, error=${(error as Error).message}`);
          this.addMessage({
            role: 'tool',
            content: `Error: ${(error as Error).message}`,
            toolCallId: toolCall.id,
            name: toolCall.name,
          });
        }
      }
      console.log(`[Agent Debug] Step ${step + 1} completed`);
    }

    console.warn(`[Agent Debug] Reached maximum steps limit: ${this.maxSteps}`);
    return {
      shouldStop: true,
      finalAnswer: `Reached maximum steps (${this.maxSteps})`,
      messages: this.messages,
    };
  }
}
