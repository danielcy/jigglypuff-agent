/**
 * JigglyPuff Agent System - new architecture entry point
 */

import agentRegistry from './agentRegistry';
import { builtInAgents } from './built-in';

// Register all built-in agents
for (const agent of builtInAgents) {
  agentRegistry.registerAgent(agent);
}

export * from './types';
export * from './agentRegistry';
export * from './agentContext';
export * from './runAgent';
export * from './forkSubagent';
export { default as agentRegistry } from './agentRegistry';
