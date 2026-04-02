import { BaseTool } from './baseTool';
import { TodoWriteTool } from './todoWriteTool';
import { PetPortraitUpdateTool } from './petPortraitUpdateTool';
import { ForkSubagentTool } from './forkSubagentTool';
import { ScriptSaveTool } from './scriptSaveTool';
import { ShotSaveTool } from './shotSaveTool';
import { AnalysisSaveTool } from './analysisSaveTool';
import { ShellTool } from './shellTool';
import { VideoAnalyzeTool } from './videoAnalyzeTool';
import { FileReaderTool } from './fileReaderTool';
import { FileEditorTool } from './fileEditorTool';
import { ImageGenerateTool } from './imageGenerateTool';
import { VideoGenerateTool } from './videoGenerateTool';

class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  registerTool(tool: BaseTool): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}

const defaultRegistry = new ToolRegistry();

defaultRegistry.registerTool(new TodoWriteTool());
defaultRegistry.registerTool(new PetPortraitUpdateTool());
defaultRegistry.registerTool(new ForkSubagentTool());
defaultRegistry.registerTool(new ScriptSaveTool());
defaultRegistry.registerTool(new ShotSaveTool());
defaultRegistry.registerTool(new AnalysisSaveTool());
defaultRegistry.registerTool(new ShellTool());
defaultRegistry.registerTool(new VideoAnalyzeTool());
defaultRegistry.registerTool(new FileReaderTool());
defaultRegistry.registerTool(new FileEditorTool());
defaultRegistry.registerTool(new ImageGenerateTool());
defaultRegistry.registerTool(new VideoGenerateTool());

export default defaultRegistry;
export { ToolRegistry };
