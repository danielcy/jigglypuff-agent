import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseTool } from './baseTool';
import type { Creation } from '../types';

const execAsync = promisify(exec);

const ALLOWED_COMMANDS = new Set([
  'ls',
  'pwd',
  'cat',
  'head',
  'tail',
  'find',
]);

const MAX_OUTPUT_SIZE = 100 * 1024;
const DEFAULT_TIMEOUT = 30000;

export class ShellTool extends BaseTool {
  name = 'shell';
  description = 'Execute shell commands (restricted to safe commands: ls, pwd, cat, head, tail, find)';

  inputSchema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute',
      },
    },
    required: ['command'],
  };

  async execute(args: { command: string }, creation: Creation): Promise<any> {
    const { command } = args;

    if (!command || typeof command !== 'string') {
      throw new Error('Command is required and must be a string');
    }

    const firstWord = command.trim().split(/\s+/)[0];
    if (!ALLOWED_COMMANDS.has(firstWord)) {
      throw new Error(`Command "${firstWord}" is not allowed. Allowed commands: ${Array.from(ALLOWED_COMMANDS).join(', ')}`);
    }

    const timeout = setTimeout(() => {
      throw new Error(`Command timed out after ${DEFAULT_TIMEOUT / 1000} seconds`);
    }, DEFAULT_TIMEOUT);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        maxBuffer: MAX_OUTPUT_SIZE,
      });

      clearTimeout(timeout);

      let output = stdout;
      if (stderr) {
        output += '\n--- stderr ---\n' + stderr;
      }

      if (output.length > MAX_OUTPUT_SIZE) {
        output = output.slice(0, MAX_OUTPUT_SIZE) + '\n... (output truncated)';
      }

      return {
        command,
        output,
        truncated: output.length > MAX_OUTPUT_SIZE,
      };
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }
}
