/**
 * Tool Registry
 * 
 * Manages and provides access to all external tools and integrations
 * that Manus AI can use to execute tasks.
 */

import { BrowserTool } from './browser';
import { FileSystemTool } from './filesystem';
import { ShellTool } from './shell';
import { CodeExecutionTool } from './code-execution';

export interface BaseTool {
    name: string;
    description: string;
    initialize(): Promise<void>;
    cleanup(): Promise<void>;
}

export class ToolRegistry {
    private tools: Map<string, BaseTool>;

    constructor() {
        this.tools = new Map<string, BaseTool>();

        // Register all available tools
        this.registerTool('browser', new BrowserTool());
        this.registerTool('filesystem', new FileSystemTool());
        this.registerTool('shell', new ShellTool());
        this.registerTool('code', new CodeExecutionTool());
    }

    /**
     * Register a tool in the registry
     */
    public registerTool(name: string, tool: BaseTool): void {
        this.tools.set(name, tool);
    }

    /**
     * Get a tool by name
     */
    public getTool<T extends BaseTool>(name: string): T {
        const tool = this.tools.get(name);

        if (!tool) {
            throw new Error(`Tool "${name}" is not registered`);
        }

        return tool as T;
    }

    /**
     * Get a list of all available tools
     */
    public getAvailableTools(): { name: string; description: string }[] {
        return Array.from(this.tools.entries()).map(([name, tool]) => ({
            name,
            description: tool.description,
        }));
    }
}

// Export individual tools for direct use
export * from './browser';
export * from './filesystem';
export * from './shell';
export * from './code-execution';