/**
 * General Purpose Agent
 * 
 * A fallback agent that can handle various types of tasks
 * by combining multiple tools and approaches.
 */

import { TaskStep } from '@prisma/client';
import { BaseSpecializedAgent, AgentExecutionResult } from './base-agent';
import { CodeExecutionTool } from '../../tools/code-execution';
import { FileSystemTool } from '../../tools/filesystem';
import { BrowserTool } from '../../tools/browser';
import { ShellTool } from '../../tools/shell';
import { getLLMResponse } from '../../../lib/ai';

export class GeneralPurposeAgent extends BaseSpecializedAgent {
    private codeExecutionTool: CodeExecutionTool;
    private fileSystemTool: FileSystemTool;
    private browserTool: BrowserTool;
    private shellTool: ShellTool;

    constructor() {
        super('GeneralPurposeAgent');
        this.codeExecutionTool = new CodeExecutionTool();
        this.fileSystemTool = new FileSystemTool();
        this.browserTool = new BrowserTool();
        this.shellTool = new ShellTool();
    }

    /**
     * Execute a general purpose task step
     */
    public async executeStep(step: TaskStep): Promise<AgentExecutionResult> {
        try {
            await this.logInfo(step.taskId, step.id, `GeneralPurposeAgent executing step: ${step.description}`);

            // Initialize all tools
            await this.initializeTools();

            // Analyze the step to determine what tools and actions are needed
            const actions = await this.analyzeStepForActions(step);

            // Execute each action
            const results = [];

            for (const action of actions) {
                await this.logInfo(step.taskId, step.id, `Executing action: ${action.type} with tool: ${action.tool}`);

                // Record tool usage start
                const toolUsageId = await this.recordToolUsageStart(
                    step.taskId,
                    action.tool,
                    JSON.stringify(action)
                );

                try {
                    // Execute the action with the appropriate tool
                    const result = await this.executeAction(action);

                    // Record success
                    await this.recordToolUsageEnd(toolUsageId, true, result);

                    // Add to results
                    results.push(result);
                } catch (error) {
                    // Record failure
                    await this.recordToolUsageEnd(
                        toolUsageId,
                        false,
                        null,
                        error instanceof Error ? error.message : String(error)
                    );

                    // Log the error but continue with other actions
                    await this.logWarning(
                        step.taskId,
                        step.id,
                        `Action failed: ${action.type} with tool: ${action.tool}`,
                        { error: error instanceof Error ? error.message : String(error) }
                    );
                }
            }

            // Clean up resources
            await this.cleanupTools();

            // Process and combine results
            const finalResult = this.processResults(results);

            // Return success with the final result
            return {
                success: true,
                output: finalResult,
            };
        } catch (error) {
            // Make sure resources are cleaned up
            try {
                await this.cleanupTools();
            } catch (cleanupError) {
                // Ignore cleanup errors
            }

            // Log the error
            await this.logError(
                step.taskId,
                step.id,
                `Step execution failed`,
                { error: error instanceof Error ? error.message : String(error) }
            );

            // Return failure
            return {
                success: false,
                output: null,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Determine if this agent can handle a particular task step
     */
    public async canHandleStep(step: TaskStep): Promise<boolean> {
        // The general purpose agent can handle any step,
        // but it's designed to be a fallback, so return true
        return true;
    }

    /**
     * Initialize all tools
     */
    private async initializeTools(): Promise<void> {
        await this.codeExecutionTool.initialize();
        await this.fileSystemTool.initialize();
        await this.browserTool.initialize();
        await this.shellTool.initialize();
    }

    /**
     * Clean up all tools
     */
    private async cleanupTools(): Promise<void> {
        await this.codeExecutionTool.cleanup();
        await this.fileSystemTool.cleanup();
        await this.browserTool.close();
        await this.shellTool.cleanup();
    }

    /**
     * Analyze a step description to determine what tools and actions are needed
     */
    private async analyzeStepForActions(step: TaskStep): Promise<any[]> {
        // Use LLM to analyze the step description and determine tools and actions
        const prompt = `
Task Analysis Request:

I need to analyze the following task step to determine the best tools and actions to use:

Step Description: ${step.description}

Available tools:
1. browser - For web browsing, information retrieval, and web automation
2. code - For code generation, execution, and analysis
3. filesystem - For file operations and document management
4. shell - For executing shell commands and system operations

Please analyze this step and provide a JSON array of actions to take, where each action includes:
- "type": The type of action to perform (e.g., "search", "navigate", "execute_code", "read_file")
- "tool": The tool to use (one of: "browser", "code", "filesystem", "shell")
- "parameters": An object with parameters specific to the action type

Example output format:
[
  {
    "type": "search",
    "tool": "browser",
    "parameters": {
      "query": "latest research on climate change"
    }
  },
  {
    "type": "generate_code",
    "tool": "code",
    "parameters": {
      "language": "python",
      "problem": "Parse and summarize the search results"
    }
  }
]

Please provide 1-3 actions that would be most effective for completing this step.
`;

        try {
            const response = await getLLMResponse(prompt, {
                temperature: 0.2, // Lower temperature for more consistent results
                systemPrompt: 'You are a helpful AI task analyzer. You only respond with valid JSON, no explanations.',
            });

            // Parse the response as JSON
            try {
                const parsedActions = JSON.parse(response);

                if (Array.isArray(parsedActions)) {
                    return parsedActions;
                } else {
                    throw new Error('Response is not an array');
                }
            } catch (parseError) {
                // Fallback: try to extract JSON from the response using regex
                const jsonMatch = response.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    try {
                        const extractedJson = JSON.parse(jsonMatch[0]);
                        if (Array.isArray(extractedJson)) {
                            return extractedJson;
                        }
                    } catch (extractError) {
                        console.error('Failed to extract JSON from response:', extractError);
                    }
                }

                // If all parsing attempts fail, return a default action
                return [
                    {
                        type: 'execute_code',
                        tool: 'code',
                        parameters: {
                            language: 'python',
                            code: `
# Simple script to handle the task
import json

def process_task():
    task_description = """${step.description}"""
    print(f"Processing task: {task_description}")
    
    # Basic analysis
    words = task_description.lower().split()
    word_count = len(words)
    
    result = {
        "task_analysis": {
            "word_count": word_count,
            "contains_web_request": any(w in words for w in ["web", "browse", "search", "internet", "online"]),
            "contains_code_request": any(w in words for w in ["code", "program", "script", "function", "algorithm"]),
            "contains_file_request": any(w in words for w in ["file", "document", "read", "write", "save"]),
            "contains_shell_request": any(w in words for w in ["command", "shell", "execute", "run", "system"])
        },
        "conclusion": "Task requires general processing",
        "response": f"Completed analysis of the task: {task_description[:50]}..."
    }
    
    print(json.dumps(result, indent=2))
    return result

process_task()
              `
                        }
                    }
                ];
            }
        } catch (error) {
            console.error('Error analyzing step:', error);

            // Return a default action
            return [
                {
                    type: 'execute_code',
                    tool: 'code',
                    parameters: {
                        language: 'python',
                        code: `print("Processing task: ${step.description.replace(/"/g, '\\"')}")`
                    }
                }
            ];
        }
    }

    /**
     * Execute an action with the appropriate tool
     */
    private async executeAction(action: any): Promise<any> {
        switch (action.tool) {
            case 'browser':
                return this.executeBrowserAction(action);
            case 'code':
                return this.executeCodeAction(action);
            case 'filesystem':
                return this.executeFileSystemAction(action);
            case 'shell':
                return this.executeShellAction(action);
            default:
                throw new Error(`Unknown tool: ${action.tool}`);
        }
    }

    /**
     * Execute a browser action
     */
    private async executeBrowserAction(action: any): Promise<any> {
        const { type, parameters } = action;

        switch (type) {
            case 'search':
                return this.browserTool.search(parameters.query);
            case 'navigate':
                return this.browserTool.navigate(parameters.url);
            case 'extract':
                return this.browserTool.extractContent(parameters.selector);
            case 'click':
                return this.browserTool.click(parameters.selector);
            case 'fill':
                return this.browserTool.fillForm(parameters.selector, parameters.value);
            case 'screenshot':
                return this.browserTool.takeScreenshot();
            default:
                throw new Error(`Unknown browser action type: ${type}`);
        }
    }

    /**
     * Execute a code action
     */
    private async executeCodeAction(action: any): Promise<any> {
        const { type, parameters } = action;

        switch (type) {
            case 'generate_code':
                // Use AI service to generate code
                const genCodePrompt = `
Write ${parameters.language} code to solve the following problem:

${parameters.problem}

Only provide the code without explanations.
`;
                const generatedCode = await getLLMResponse(genCodePrompt, {
                    systemPrompt: `You are an expert ${parameters.language} programmer. You write clean, efficient, and well-commented code.`,
                    temperature: 0.2,
                });

                return { success: true, code: generatedCode, language: parameters.language };

            case 'execute_code':
                return this.codeExecutionTool.execute(
                    parameters.code,
                    parameters.language,
                    {
                        args: parameters.args || [],
                        env: parameters.env || {},
                    }
                );

            case 'execute_function':
                return this.codeExecutionTool.executeFunction(
                    parameters.function,
                    parameters.language,
                    parameters.data || {},
                    {
                        args: parameters.args || [],
                        env: parameters.env || {},
                    }
                );

            default:
                throw new Error(`Unknown code action type: ${type}`);
        }
    }

    /**
     * Execute a file system action
     */
    private async executeFileSystemAction(action: any): Promise<any> {
        const { type, parameters } = action;

        switch (type) {
            case 'read_file':
                const content = await this.fileSystemTool.readFile(parameters.path);
                return { success: true, content: content.toString('utf-8'), path: parameters.path };

            case 'write_file':
                await this.fileSystemTool.writeFile(
                    parameters.path,
                    Buffer.from(parameters.content, 'utf-8')
                );
                return { success: true, path: parameters.path };

            case 'list_directory':
                return this.fileSystemTool.readdir(parameters.path);

            case 'create_directory':
                await this.fileSystemTool.mkdir(parameters.path);
                return { success: true, path: parameters.path };

            case 'delete':
                await this.fileSystemTool.delete(parameters.path, parameters.recursive || false);
                return { success: true, path: parameters.path };

            case 'copy':
                await this.fileSystemTool.copy(
                    parameters.source,
                    parameters.destination,
                    parameters.recursive || false
                );
                return { success: true, source: parameters.source, destination: parameters.destination };

            case 'move':
                await this.fileSystemTool.move(parameters.source, parameters.destination);
                return { success: true, source: parameters.source, destination: parameters.destination };

            default:
                throw new Error(`Unknown file system action type: ${type}`);
        }
    }

    /**
     * Execute a shell action
     */
    private async executeShellAction(action: any): Promise<any> {
        const { type, parameters } = action;

        switch (type) {
            case 'execute_command':
                return this.shellTool.execute(parameters.command);

            case 'run_script':
                return this.shellTool.runScript(parameters.script, parameters.interpreter || 'bash');

            default:
                throw new Error(`Unknown shell action type: ${type}`);
        }
    }

    /**
     * Process and combine results from multiple actions
     */
    private async processResults(results: any[]): Promise<any> {
        // If there's only one result, return it directly
        if (results.length === 1) {
            return results[0];
        }

        // If there are multiple results, combine them
        const combinedResult = {
            success: true,
            actions_executed: results.length,
            results: results,
            summary: await this.generateResultsSummary(results),
        };

        return combinedResult;
    }

    /**
     * Generate a summary of multiple action results
     */
    private async generateResultsSummary(results: any[]): Promise<string> {
        // Create a simplified version of results for the prompt
        const simplifiedResults = results.map((result, index) => {
            // Create a simple representation for the prompt
            const summary: Record<string, any> = {};

            // Copy primitive properties
            for (const key in result) {
                if (
                    typeof result[key] === 'string' ||
                    typeof result[key] === 'number' ||
                    typeof result[key] === 'boolean'
                ) {
                    if (typeof result[key] === 'string' && result[key].length > 500) {
                        // Truncate long strings
                        summary[key] = result[key].substring(0, 500) + '...';
                    } else {
                        summary[key] = result[key];
                    }
                }
            }

            return { action_index: index, result: summary };
        });

        // Create a prompt for summarizing the results
        const prompt = `
I have executed multiple actions for a task and need a summary of the results:

Actions and Results:
${JSON.stringify(simplifiedResults, null, 2)}

Please provide a concise summary of what was accomplished by these actions. Focus on key findings, outputs, or insights.
`;

        try {
            const summary = await getLLMResponse(prompt, {
                temperature: 0.3,
                maxTokens: 200,
            });

            return summary;
        } catch (error) {
            console.error('Error generating results summary:', error);
            return 'Multiple actions were executed successfully.';
        }
    }

    /**
     * Record the start of a tool usage
     */
    private async recordToolUsageStart(
        taskId: string,
        toolName: string,
        command: string
    ): Promise<string> {
        const toolUsage = await this.prisma.toolUsage.create({
            data: {
                taskId,
                toolName,
                command,
                startedAt: new Date(),
            },
        });

        return toolUsage.id;
    }

    /**
     * Record the end of a tool usage
     */
    private async recordToolUsageEnd(
        toolUsageId: string,
        success: boolean,
        output: any = null,
        error: string | null = null
    ): Promise<void> {
        await this.prisma.toolUsage.update({
            where: { id: toolUsageId },
            data: {
                endedAt: new Date(),
                success,
                output: output ? JSON.stringify(output) : null,
                error,
            },
        });
    }
}