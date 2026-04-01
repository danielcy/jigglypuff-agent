/**
 * @fileoverview Agent Registry - manages agent definitions
 * Allows registration and lookup of different agent types
 */

import type { AgentDefinition } from './types';

/**
 * Agent Registry - singleton that holds all registered agent definitions
 */
class AgentRegistry {
  private agents: Map<string, AgentDefinition> = new Map();

  /**
   * Register a new agent definition
   */
  registerAgent(definition: AgentDefinition): void {
    if (this.agents.has(definition.agentType)) {
      console.warn(`[AgentRegistry] Overwriting existing agent: ${definition.agentType}`);
    }
    this.agents.set(definition.agentType, definition);
    console.log(`[AgentRegistry] Registered agent: ${definition.agentType}`);
  }

  /**
   * Get an agent definition by type
   */
  getAgent(agentType: string): AgentDefinition | undefined {
    return this.agents.get(agentType);
  }

  /**
   * Check if an agent type exists
   */
  hasAgent(agentType: string): boolean {
    return this.agents.has(agentType);
  }

  /**
   * Get all registered agent types
   */
  getAllAgentTypes(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get all registered agent definitions
   */
  getAllAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  /**
   * Clear all registered agents (mostly for testing)
   */
  clear(): void {
    this.agents.clear();
  }
}

/**
 * Global default agent registry
 */
const defaultRegistry = new AgentRegistry();

export default defaultRegistry;
export { AgentRegistry };
