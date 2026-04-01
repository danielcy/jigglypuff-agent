import fs from 'fs';
import path from 'path';
import { BaseTool } from './baseTool';
import type { Creation } from '../types';

const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BLOCKED_DIRS = new Set([
  'node_modules',
  '.git',
  '.github',
  '.trae',
  'data',
  'node_modules/.cache',
]);

export class FileReaderTool extends BaseTool {
  name = 'file_reader';
  description = 'Read content from a file within the project directory (max 10MB)';

  inputSchema = {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the file to read, relative to project root',
      },
    },
    required: ['filePath'],
  };

  async execute(args: { filePath: string }, creation: Creation): Promise<any> {
    const { filePath } = args;

    if (!filePath || typeof filePath !== 'string') {
      throw new Error('filePath is required and must be a string');
    }

    const resolvedPath = path.resolve(PROJECT_ROOT, filePath);

    if (!resolvedPath.startsWith(PROJECT_ROOT)) {
      throw new Error('Access denied: Cannot read files outside project directory');
    }

    const relativePath = path.relative(PROJECT_ROOT, resolvedPath);
    const pathSegments = relativePath.split(path.sep);
    for (const segment of pathSegments) {
      if (BLOCKED_DIRS.has(segment)) {
        throw new Error(`Access denied: Cannot access blocked directory "${segment}"`);
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stat = fs.statSync(resolvedPath);
    if (stat.size > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${(stat.size / 1024 / 1024).toFixed(2)} MB > 10 MB limit`);
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    return {
      filePath: relativePath,
      size: stat.size,
      content: content.length > 100000 ? content.slice(0, 100000) + '\n... (content truncated)' : content,
      truncated: content.length > 100000,
    };
  }
}
