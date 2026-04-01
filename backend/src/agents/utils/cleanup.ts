/**
 * @fileoverview Cleanup hook management for agent execution
 */

import type { CleanupHook } from '../types';

/**
 * Register a cleanup hook to be executed when agent completes
 * @param cleanupHooks - The array of cleanup hooks from agent context
 * @param description Description of what this hook cleans up
 * @param cleanupFn The cleanup function to execute
 */
export function registerCleanup(
  cleanupHooks: CleanupHook[],
  description: string,
  cleanupFn: () => Promise<void> | void
): void {
  cleanupHooks.push({
    description,
    cleanup: cleanupFn,
  });
}

/**
 * Execute all cleanup hooks in reverse order (LIFO)
 * @param cleanupHooks Array of cleanup hooks to execute
 */
export async function executeCleanup(cleanupHooks: CleanupHook[]): Promise<void> {
  console.log(`[Agent Cleanup] Running ${cleanupHooks.length} cleanup hook(s)...`);

  // Execute in reverse order - last added is first cleaned up
  const reversed = [...cleanupHooks].reverse();

  for (const hook of reversed) {
    try {
      console.log(`[Agent Cleanup] Running: ${hook.description}`);
      await Promise.resolve(hook.cleanup());
    } catch (error) {
      console.error(`[Agent Cleanup] Failed: ${hook.description}`, error);
      // Continue with other cleanups even if one fails
    }
  }

  console.log(`[Agent Cleanup] All cleanup hooks completed`);
}

/**
 * Create an AbortController that registers cleanup to abort on agent termination
 */
export function createAbortController(cleanupHooks: CleanupHook[]): AbortController {
  const controller = new AbortController();

  registerCleanup(cleanupHooks, 'Abort pending requests', () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  });

  return controller;
}
