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

const DISALLOWED_EXTENSIONS = new Set([
  '.env',
  '.env.local',
  '.gitignore',
  '.DS_Store',
]);

export class FileEditorTool extends BaseTool {
  name = 'file_editor';
  description = 'Create or edit a file within the project directory';

  inputSchema = {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the file to create/edit, relative to project root',
      },
      content: {
        type: 'string',
        description: 'The full content to write to the file',
      },
      operation: {
        type: 'string',
        enum: ['create', 'edit'],
        description: 'Operation type: create new file or edit existing file',
      },
    },
    required: ['filePath', 'content', 'operation'],
  };

  async execute(args: {
    filePath: string;
    content: string;
    operation: 'create' | 'edit';
  }, creation: Creation): Promise<any> {
    const { filePath, content, operation } = args;

    if (!filePath || typeof filePath !== 'string') {
      throw new Error('filePath is required and must be a string');
    }
    if (content === undefined || typeof content !== 'string') {
      throw new Error('content is required and must be a string');
    }
    if (!['create', 'edit'].includes(operation)) {
      throw new Error('operation must be either "create" or "edit"');
    }

    const resolvedPath = path.resolve(PROJECT_ROOT, filePath);

    if (!resolvedPath.startsWith(PROJECT_ROOT)) {
      throw new Error('Access denied: Cannot write files outside project directory');
    }

    const relativePath = path.relative(PROJECT_ROOT, resolvedPath);
    const pathSegments = relativePath.split(path.sep);
    for (const segment of pathSegments) {
      if (BLOCKED_DIRS.has(segment)) {
        throw new Error(`Access denied: Cannot access blocked directory "${segment}"`);
      }
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    if (DISALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(`Access denied: Cannot write files with extension "${ext}"`);
    }

    if (content.length > MAX_FILE_SIZE) {
      throw new Error(`Content too large: ${content.length} bytes > ${MAX_FILE_SIZE} bytes limit`);
    }

    if (operation === 'create' && fs.existsSync(resolvedPath)) {
      throw new Error(`File already exists: ${filePath}, use "edit" operation to modify it`);
    }
    if (operation === 'edit' && !fs.existsSync(resolvedPath)) {
      throw new Error(`File does not exist: ${filePath}, use "create" operation to create it`);
    }

    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(resolvedPath, content, 'utf-8');

    const stat = fs.statSync(resolvedPath);
    return {
      filePath: relativePath,
      operation,
      size: stat.size,
      success: true,
    };
  }
}
