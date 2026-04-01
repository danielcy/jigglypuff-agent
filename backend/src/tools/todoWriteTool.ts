import { BaseTool } from './baseTool';
import type { Creation, TodoItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse markdown todo list into structured items.
 * Supports:
 * - "- [ ] item" or "* [ ] item" -> pending
 * - "- [x]" or "* [x]" -> completed
 * - "- [~]" or "- [-]" -> in_progress
 */
export class TodoWriteTool extends BaseTool {
  name = 'todo_write';
  description = 'Write or update the todo list for the current creation project. Input is a markdown formatted todo list with checkboxes.';

  inputSchema = {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Markdown formatted todo list, e.g. "- [ ] Do something\\n- [x] Done thing"',
      },
    },
    required: ['content'],
  };

  async execute(args: {
    content: string;
  }, creation: Creation): Promise<{ todos: TodoItem[] }> {
    const content = args.content || '';
    const lines = content.split('\n');
    const todos: TodoItem[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Match markdown todo: - [ ] task, * [x] task, etc.
      const match = trimmed.match(/^[-*]\s+\[([ x~-√])\]\s+(.*)$/);

      let status: 'pending' | 'in_progress' | 'completed' = 'pending';
      let itemContent = trimmed;

      if (match) {
        const [, checkbox, text] = match;
        itemContent = text;
        switch (checkbox.toLowerCase()) {
          case 'x':
          case '√':
            status = 'completed';
            break;
          case '~':
          case '-':
            status = 'in_progress';
            break;
          default:
            status = 'pending';
        }
      }

      if (itemContent.trim()) {
        todos.push({
          id: uuidv4(),
          content: itemContent.trim(),
          status,
          createdAt: new Date(),
        });
      }
    }

    creation.plan = todos;
    return { todos };
  }
}
