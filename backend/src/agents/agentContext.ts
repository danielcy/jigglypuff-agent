/**
 * @fileoverview Agent Context Creation and Isolation
 * Each agent execution gets an isolated context with its own state
 */

import type { Creation, LLMConfig } from '../types';
import type { AgentContext, AgentDefinition } from './types';
import { createAbortController, registerCleanup } from './utils/cleanup';

/**
 * Generate a unique agent ID
 */
function generateAgentId(): string {
  return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Filter tool allowlist based on agent definition
 */
function getAllToolNames(): string[] {
  // Import here to avoid circular dependency
  const toolRegistry = require('../tools/toolRegistry').default;
  return toolRegistry.getToolNames();
}

/**
 * Build allowed tools set from agent definition
 */
function buildAllowedTools(agentDef: AgentDefinition): Set<string> {
  const allTools = getAllToolNames();
  let allowed: Set<string>;

  if (agentDef.tools && agentDef.tools.length > 0) {
    // Check if '*' is in the list - means allow all tools
    if (agentDef.tools.includes('*')) {
      allowed = new Set(allTools);
    } else {
      // Allowlist mode - only specified tools are allowed
      allowed = new Set(agentDef.tools);
    }
  } else {
    // Allow everything by default
    allowed = new Set(allTools);
  }

  // Remove disallowed tools
  if (agentDef.disallowedTools && agentDef.disallowedTools.length > 0) {
    for (const tool of agentDef.disallowedTools) {
      allowed.delete(tool);
    }
  }

  return allowed;
}

/**
 * Create a new isolated agent context
 * @param parentContext Optional parent context for forking
 * @param overrides Overrides for the new context
 */
export function createAgentContext(
  parentContext: AgentContext | undefined,
  overrides: {
    creation: Creation;
    llmConfig: LLMConfig;
    agentDef: AgentDefinition;
    onStep?: (step: number, content: string, streaming?: boolean) => void;
  }
): AgentContext {
  const allowedTools = buildAllowedTools(overrides.agentDef);
  const agentId = generateAgentId();
  const controller = createAbortController([]);

  const context: AgentContext = {
    agentId,
    creation: overrides.creation,
    llmConfig: overrides.llmConfig,
    allowedTools,
    abortController: controller,
    onStep: overrides.onStep,
    cleanupHooks: [],
  };

  // If we have a parent, we could inherit certain things if needed in the future
  // Currently we keep full isolation

  return context;
}

/**
 * Register a cleanup hook in the agent context
 */
export function registerContextCleanup(
  context: AgentContext,
  description: string,
  cleanup: () => Promise<void> | void
): void {
  registerCleanup(context.cleanupHooks, description, cleanup);
}
