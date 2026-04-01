import { Request, Response } from 'express';
import * as creationDao from '../database/creationDao';
import * as llmConfigDao from '../database/llmConfigDao';
import { getPetById } from '../database/petDao';
import { agentRegistry, createAgentContext, runAgent } from '../agents';
import type { Creation, SSEEvent, SSEStepEvent, Pet } from '../types';
import type { AgentMessage } from '../agents/baseAgent';

export function listCreations(req: Request, res: Response) {
  try {
    const creations = creationDao.getAllCreations();
    res.json({
      code: 0,
      message: 'success',
      data: creations,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function getCreation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const creation = creationDao.getCreationById(id as string);
    if (!creation) {
      return res.status(404).json({
        code: 1,
        message: 'Creation not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: creation,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function createCreation(req: Request, res: Response) {
  try {
    const { title, petIds = [], materialIds = [] } = req.body;
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        code: 1,
        message: 'Title is required',
      });
    }
    const creation = creationDao.createCreation({
      title: title.trim(),
      petIds,
      materialIds,
    });
    res.json({
      code: 0,
      message: 'success',
      data: creation,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function updateCreation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body as Partial<Creation>;
    const creation = creationDao.updateCreation(id as string, updates);
    if (!creation) {
      return res.status(404).json({
        code: 1,
        message: 'Creation not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: creation,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function deleteCreation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const deleted = creationDao.deleteCreation(id as string);
    if (!deleted) {
      return res.status(404).json({
        code: 1,
        message: 'Creation not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: { deleted: true },
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export async function chat(req: Request, res: Response) {
  try {
    const { id } = req.params;
    // Support both GET (for EventSource) and POST
    const message = req.method === 'GET'
      ? (req.query.message as string)
      : req.body.message;
    const agentType = req.method === 'GET'
      ? (req.query.agentType as string)
      : req.body.agentType;

    const creation = creationDao.getCreationById(id as string);
    if (!creation) {
      return res.status(404).json({
        code: 1,
        message: 'Creation not found',
      });
    }

    const defaultConfig = llmConfigDao.getDefaultLLMConfig();
    if (!defaultConfig) {
      return res.status(400).json({
        code: 1,
        message: 'No default LLM configuration found. Please set up a default LLM in settings.',
      });
    }

    // SSE headers according to spec
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    // Disable Nagle's algorithm - send small packets immediately
    if (res.socket) {
      (res.socket as any).setNoDelay(true);
    }

    // Flush headers immediately
    if (res.socket) {
      const socket = res.socket as any;
      if (typeof socket.flush === 'function') {
        socket.flush();
      }
    }

    const sendSSE = (event: string, data: any) => {
      // Standard SSE format: event: name\n data: {...}\n\n
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);

      // Force flush through any buffers
      const resAny = res as any;
      if (resAny.flush) {
        // compression middleware adds flush
        resAny.flush();
      }
      if (res.socket && typeof (res.socket as any).flush === 'function') {
        // flush to network layer
        (res.socket as any).flush();
      }
    };

    const onStep = (step: number, content: string, streaming?: boolean) => {
      sendSSE('step', {
        step,
        content,
        streaming: !!streaming,
      });
    };

    // Get agent definition from registry
    const agentDef = agentRegistry.getAgent(agentType || 'lead');
    if (!agentDef) {
      if (!res.headersSent) {
        res.status(404).json({
          code: 1,
          message: `Agent type '${agentType}' not found`,
        });
      } else {
        res.write(`event: error\ndata: ${JSON.stringify({ message: `Agent type '${agentType}' not found` })}\n\n`);
        res.end();
      }
      return;
    }

    // For lead agent: build the full input with project state and pet information
    let fullInput = message;
    if ((!agentType || agentType === 'lead')) {
      // Get all bound pets
      const boundPets: Pet[] = [];
      if (creation.petIds && creation.petIds.length > 0) {
        for (const petId of creation.petIds) {
          const pet = getPetById(petId);
          if (pet) {
            boundPets.push(pet);
          }
        }
      }

      let petsSection = '';
      if (boundPets.length > 0) {
        petsSection = '\nBound pets:';
        for (const pet of boundPets) {
          petsSection += `\n- ${pet.name}`;
          if (pet.breed) petsSection += ` (${pet.breed})`;
          if (pet.age !== undefined) petsSection += `, ${pet.age} years old`;
          if (pet.portrait) {
            petsSection += `\n  AI portrait: ${pet.portrait}`;
          }
        }
        petsSection += '\n';
      }

      fullInput = `Current project state:
Title: ${creation.title}
Status: ${creation.status}
Current stage: ${creation.currentStage}
Has analysis: ${creation.analysisResult ? 'Yes' : 'No'}
Has script: ${creation.script ? 'Yes' : 'No'}
Has shots: ${creation.shots ? 'Yes' : 'No'}
${petsSection}${creation.plan && creation.plan.length > 0 ? `
Current todo list:
${creation.plan.map(todo => {
  const emoji = todo.status === 'completed' ? '✅' : todo.status === 'in_progress' ? '⚙️' : '○';
  return `  ${emoji} ${todo.content}`;
}).join('\n')}

Please: continue working based on the existing todo list above. Update progress when items are completed, add new items when needed, do NOT create a completely new todo list from scratch unless explicitly requested by the user.
` : ''}User message: ${message}`;
    }

    // Create agent context
    const context = createAgentContext(undefined, {
      creation,
      llmConfig: defaultConfig,
      agentDef,
      onStep,
    });

    // Load existing chat history - messages will be added to context by runAgent
    // Note: In new architecture, chat history is already stored in creation.chatHistory
    // The full context is built fresh each time by lead agent with updated project state

    const result = await runAgent(agentDef, context, fullInput, creation.chatHistory);
    const messages = result.messages!;
    console.log(`[Chat Debug] Agent finished: success=${result.success}, messages_count=${messages.length}, has_finalAnswer=${!!result.finalAnswer}, finalAnswer_length=${result.finalAnswer?.length}`);

    // Filter out system messages (don't show to user)
    // For user messages: we save the original user input instead of the full context with prefix
    // Only keep assistant and tool messages from agent messages
    const newMessages = [
      // Add the original user message (without the context prefix)
      {
        id: Date.now().toString() + Math.random().toString(36).substr(2),
        role: 'user' as const,
        content: message,
        timestamp: new Date(),
      },
      // Add assistant and tool messages from agent
      ...messages
        .filter(msg => msg.role !== 'system')
        .filter(msg => msg.role !== 'user') // we already added the original user message
        .map(msg => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2),
          role: msg.role,
          content: msg.content as string,
          toolName: msg.name,
          toolArgs: msg.toolCalls?.[0]?.arguments,
          timestamp: new Date(),
        })),
    ];

    // Append to existing chat history instead of overwriting
    creation.chatHistory = [
      ...(creation.chatHistory || []),
      ...newMessages
    ];

    // Check if final answer is empty
    if (!result.finalAnswer || result.finalAnswer.trim().length === 0) {
      console.warn(`[Agent Debug] Final answer is empty for creation ${id}, agentType ${agentType}`);
      if (!res.headersSent) {
        res.status(500).json({
          code: 1,
          message: 'Agent returned an empty response, please try again',
        });
      } else {
        res.write(`event: error\ndata: ${JSON.stringify({ message: 'Agent returned an empty response, please try again' })}\n\n`);
        res.end();
      }
      return;
    }

    // Save chatHistory and any changes made by tools (script/shots/analysisResult)
    if (result.success) {
      creation.updatedAt = new Date();
      creationDao.updateCreation(id as string, {
        ...creation,
        chatHistory: creation.chatHistory,
        updatedAt: creation.updatedAt,
      });
    }

    sendSSE('result', {
      type: 'complete',
      creation,
      message: result.finalAnswer,
    });

    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        code: 1,
        message: (error as Error).message,
      });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message: (error as Error).message })}\n\n`);
      res.end();
    }
  }
}

export async function executeTool(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { toolName, args } = req.body;

    const creation = creationDao.getCreationById(id as string);
    if (!creation) {
      return res.status(404).json({
        code: 1,
        message: 'Creation not found',
      });
    }

    const toolRegistry = (await import('../tools/toolRegistry')).default;
    const tool = toolRegistry.getTool(toolName);
    if (!tool) {
      return res.status(404).json({
        code: 1,
        message: `Tool ${toolName} not found`,
      });
    }

    const result = await tool.execute(args, creation);

    creationDao.updateCreation(id as string, {
      ...creation,
      updatedAt: new Date(),
    });

    res.json({
      code: 0,
      message: 'success',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}
