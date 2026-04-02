/**
 * @fileoverview JigglyPuff Agent Architecture - Core Type Definitions
 * Re-exports common types from baseAgent and adds new architecture types
 */

import type { Creation, LLMConfig, Tool } from '../types';
import type { AgentMessage, AgentToolCall } from './baseAgent';

// Re-export existing base types
export type { AgentMessage, AgentToolCall } from './baseAgent';

/**
 * MCP Server configuration - can be a reference to existing server or inline definition
 */
export type MCPServerSpec =
  | string  // Reference to an already defined MCP server by name
  | {
      name: string;
      command: string;
      args: string[];
      env?: Record<string, string>;
    }; // Inline definition

/**
 * Agent definition - describes what an agent does, what tools it can use, etc.
 */
export interface AgentDefinition {
  /** Unique identifier for this agent type */
  agentType: string;
  /** Description of when to use this agent */
  whenToUse: string;
  /** Human-readable description */
  description: string;
  /** System prompt for this agent */
  systemPrompt: string | (() => string);
  /** Optional: list of allowed tool names, ['*'] means all tools */
  tools?: string[];
  /** Optional: list of disallowed tool names */
  disallowedTools?: string[];
  /** Optional: MCP servers required by this agent */
  mcpServers?: MCPServerSpec[];
  /** Optional: model override (sonnet/opus/haiku) */
  model?: 'sonnet' | 'opus' | 'haiku';
  /** Optional: maximum conversation turns (default: 50) */
  maxTurns?: number;
  /** Optional: custom function to get dynamic system prompt */
  getSystemPrompt?: (context: AgentContext) => string;
}

/**
 * Cleanup hook - registers resources that need to be cleaned up after execution
 */
export interface CleanupHook {
  description: string;
  cleanup: () => Promise<void> | void;
}

/**
 * Step content type for structured data
 */
export interface AgentStepContent {
  type: 'assistant_text';
  content: string;
}

/**
 * Agent execution context - isolated per agent execution
 */
export interface AgentContext {
  /** Unique agent execution ID */
  agentId: string;
  /** The creation project this agent is working on */
  creation: Creation;
  /** LLM configuration */
  llmConfig: LLMConfig;
  /** Allowed tools set (filtered from agent definition) */
  allowedTools: Set<string>;
  /** Abort controller for cancellation */
  abortController: AbortController;
  /** Optional step callback for SSE streaming to frontend */
  onStep?: (step: number, content: AgentStepContent, streaming?: boolean) => void;
  /** Cleanup hooks to run after execution */
  cleanupHooks: CleanupHook[];
}

/**
 * Result of agent execution
 */
export interface AgentResult {
  /** Whether execution completed successfully */
  success: boolean;
  /** All messages from this execution */
  messages: AgentMessage[];
  /** Final answer if agent completed successfully */
  finalAnswer?: string;
  /** Error message if execution failed */
  error?: string;
}

/**
 * Options for forking a subagent
 */
export interface ForkSubagentOptions {
  /** Run in background (don't wait for result) */
  runInBackground?: boolean;
  /** Share context with parent (vs isolated) */
  shareContext?: boolean;
}

/**
 * Model name type
 */
export type ModelName = 'sonnet' | 'opus' | 'haiku';
