/**
 * @fileoverview Fork Subagent - spawn a subagent from current context
 * Supports forking a specialized agent with inherited context or isolated context
 */

import agentRegistry from './agentRegistry';
import { createAgentContext } from './agentContext';
import { runAgent } from './runAgent';
import type { AgentContext, AgentDefinition, AgentResult, ForkSubagentOptions } from './types';

/**
 * Fork a subagent from the current parent context
 * @param parentContext The parent agent context
 * @param agentType The type of agent to fork
 * @param userInput The user input for the subagent
 * @param options Fork options (run in background, share context)
 */
export async function forkSubagent(
  parentContext: AgentContext,
  agentType: string,
  userInput: string,
  options: ForkSubagentOptions = {}
): Promise<AgentResult> {
  console.log(`[Agent Fork] Forking subagent: ${agentType}`);

  // Get agent definition
  const agentDef = agentRegistry.getAgent(agentType);
  if (!agentDef) {
    throw new Error(`Agent type '${agentType}' not found in registry`);
  }

  // Create new isolated context
  // For now, we always create isolated context since we're just getting started
  // In the future we can implement context sharing for prompt caching
  const context = createAgentContext(parentContext, {
    creation: parentContext.creation,
    llmConfig: parentContext.llmConfig,
    agentDef,
    onStep: parentContext.onStep,
  });

  // Run the agent
  const result = await runAgent(agentDef, context, userInput);

  console.log(`[Agent Fork] Subagent ${agentType} completed: success=${result.success}`);
  return result;
}

/**
 * Check if an agent type exists that can be forked
 */
export function canForkAgent(agentType: string): boolean {
  return agentRegistry.hasAgent(agentType);
}

/**
 * List all available agent types that can be forked
 */
export function listForkableAgents(): string[] {
  return agentRegistry.getAllAgentTypes();
}
