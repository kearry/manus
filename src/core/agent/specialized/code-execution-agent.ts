/**
 * Code Execution Agent
 * 
 * A specialized agent for code generation, execution, and analysis.
 */

import { TaskStep } from '@prisma/client';
import { BaseSpecializedAgent, AgentExecutionResult } from './base-agent';
import { CodeExecutionTool } from '../../tools/code-execution';
import { FileSystemTool } from '../../tools/filesystem';
import { generateCode } from '../../../lib/ai';

export class CodeExecutionAgent extends BaseSpecializedAgent {
    private codeExecutionTool: CodeExecutionTool;
    private fileSystemTool: FileSystemTool;

    constructor() {
        super('CodeExecutionAgent');
        this.codeExecutionTool = new CodeExecutionTool();
        this.fileSystemTool = new FileSystemTool();
    }

    /**
     * Execute a code-related task step
     */
    public async executeStep(step: TaskStep): Promise<AgentExecutionResult> {
        try {
            await this.logInfo(step.taskId, step.id, `CodeExecutionAgent executing step: ${step.description}`);

            // Initialize tools
            await this.codeExecutionTool.initialize();
            await this.fileSystemTool.initialize();

            // Analyze the step to determine the code actions needed
            const codeActions = await this.analyzeStepForActions(step);

            // Execute each code action
            const results = [];

            for (const action of codeActions) {
                await this.logInfo(step.taskId, step.id, `Executing code action: ${action.type}`);

                // Record tool usage start
                const toolUsageId = await this.recordToolUsageStart(
                    step.taskId,
                    'code',
                    JSON.stringify(action)
                );

                try {
                    // Execute the appropriate code action
                    let result;

                    switch (action.type) {
                        case 'generate_code':
                            result = await this.generateCode(action.problem, action.language);
                            break;

                        case 'execute_code':
                            result = await this.executeCode(action.code, action.language, action.args);
                            break;

                        case 'save_code':
                            result = await this.saveCode(action.code, action.path, action.language);
                            break;

                        case 'load_code':
                            result = await this.loadCode(action.path);
                            break;

                        case 'optimize_code':
                            result = await this.optimizeCode(action.code, action.language, action.criteria);
                            break;

                        case 'explain_code':
                            result = await this.explainCode(action.code, action.language);
                            break;

                        default:
                            throw new Error(`Unknown code action type: ${action.type}`);
                    }

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
                        `Code action failed: ${action.type}`,
                        { error: error instanceof Error ? error.message : String(error) }
                    );
                }
            }

            // Clean up resources
            await this.codeExecutionTool.cleanup();
            await this.fileSystemTool.cleanup();

            // Return success with the collected results
            return {
                success: true,
                output: results,
            };
        } catch (error) {
            // Make sure resources are cleaned up
            try {
                await this.codeExecutionTool.cleanup();
                await this.fileSystemTool.cleanup();
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
        const description = step.description.toLowerCase();

        // Check for code-related keywords
        const codeKeywords = [
            'code', 'script', 'program', 'function', 'algorithm',
            'python', 'javascript', 'typescript', 'node', 'nodejs',
            'execute', 'run', 'compile', 'build', 'develop',
            'optimize', 'refactor', 'debug', 'fix', 'implement',
        ];

        return codeKeywords.some(keyword => description.includes(keyword));
    }

    /**
     * Analyze a step description to determine what code actions to take
     */
    private async analyzeStepForActions(step: TaskStep): Promise<any[]> {
        const description = step.description.toLowerCase();
        const actions = [];

        // Determine the programming language
        let language = 'python'; // Default language

        if (description.includes('javascript') || description.includes('js')) {
            language = 'javascript';
        } else if (description.includes('typescript') || description.includes('ts')) {
            language = 'typescript';
        } else if (description.includes('python') || description.includes('py')) {
            language = 'python';
        } else if (description.includes('bash') || description.includes('shell')) {
            language = 'bash';
        } else if (description.includes('r')) {
            language = 'r';
        } else if (description.includes('ruby') || description.includes('rb')) {
            language = 'ruby';
        } else if (description.includes('php')) {
            language = 'php';
        }

        // Check for code generation
        if (
            description.includes('create') ||
            description.includes('write') ||
            description.includes('generate') ||
            description.includes('develop')
        ) {
            // Extract the problem description from the step
            const problem = step.description;

            actions.push({
                type: 'generate_code',
                problem,
                language,
            });
        }

        // Check for code execution
        if (
            description.includes('execute') ||
            description.includes('run') ||
            description.includes('evaluate')
        ) {
            // If we're generating code first, use that result
            if (actions.length > 0 && actions[actions.length - 1].type === 'generate_code') {
                actions.push({
                    type: 'execute_code',
                    code: '${previous_result.code}',
                    language,
                    args: [],
                });
            } else {
                // Otherwise, assume code is provided or referenced elsewhere
                actions.push({
                    type: 'execute_code',
                    code: 'print("Hello World")', // Placeholder code
                    language,
                    args: [],
                });
            }
        }

        // Check for saving code
        if (
            description.includes('save') ||
            description.includes('write to file') ||
            description.includes('create file')
        ) {
            // Generate a file path based on language
            let path = `/tmp/manus-sandbox/code/script_${Date.now()}.`;

            switch (language) {
                case 'python':
                    path += 'py';
                    break;
                case 'javascript':
                    path += 'js';
                    break;
                case 'typescript':
                    path += 'ts';
                    break;
                case 'bash':
                    path += 'sh';
                    break;
                case 'r':
                    path += 'r';
                    break;
                case 'ruby':
                    path += 'rb';
                    break;
                case 'php':
                    path += 'php';
                    break;
                default:
                    path += 'txt';
            }

            // If we're generating or executing code first, use that result
            if (actions.length > 0) {
                const lastAction = actions[actions.length - 1];

                if (lastAction.type === 'generate_code') {
                    actions.push({
                        type: 'save_code',
                        code: '${previous_result.code}',
                        path,
                        language,
                    });
                } else if (lastAction.type === 'execute_code') {
                    actions.push({
                        type: 'save_code',
                        code: lastAction.code,
                        path,
                        language,
                    });
                }
            } else {
                // Otherwise, assume code is provided or referenced elsewhere
                actions.push({
                    type: 'save_code',
                    code: '# Generated code\nprint("Hello World")', // Placeholder code
                    path,
                    language,
                });
            }
        }

        // Check for loading code
        if (
            description.includes('load') ||
            description.includes('read file') ||
            description.includes('open file')
        ) {
            // Extract path from description if possible
            let path = '/tmp/manus-sandbox/code/script.';

            switch (language) {
                case 'python':
                    path += 'py';
                    break;
                case 'javascript':
                    path += 'js';
                    break;
                case 'typescript':
                    path += 'ts';
                    break;
                case 'bash':
                    path += 'sh';
                    break;
                case 'r':
                    path += 'r';
                    break;
                case 'ruby':
                    path += 'rb';
                    break;
                case 'php':
                    path += 'php';
                    break;
                default:
                    path += 'txt';
            }

            actions.push({
                type: 'load_code',
                path,
            });
        }

        // Check for optimizing code
        if (
            description.includes('optimize') ||
            description.includes('improve') ||
            description.includes('refactor') ||
            description.includes('clean')
        ) {
            // Determine optimization criteria
            const criteria = [];

            if (description.includes('performance') || description.includes('speed')) {
                criteria.push('performance');
            }

            if (description.includes('memory') || description.includes('resource')) {
                criteria.push('memory_usage');
            }

            if (description.includes('readability') || description.includes('maintainability')) {
                criteria.push('readability');
            }

            if (description.includes('security')) {
                criteria.push('security');
            }

            // If we're loading or generating code first, use that result
            if (actions.length > 0) {
                const lastAction = actions[actions.length - 1];

                if (lastAction.type === 'load_code' || lastAction.type === 'generate_code') {
                    actions.push({
                        type: 'optimize_code',
                        code: '${previous_result.code || previous_result}',
                        language,
                        criteria: criteria.length > 0 ? criteria : ['performance', 'readability'],
                    });
                }
            } else {
                // Otherwise, assume code is provided or referenced elsewhere
                actions.push({
                    type: 'optimize_code',
                    code: '# Code to optimize\nprint("Hello World")', // Placeholder code
                    language,
                    criteria: criteria.length > 0 ? criteria : ['performance', 'readability'],
                });
            }
        }

        // Check for explaining code
        if (
            description.includes('explain') ||
            description.includes('understand') ||
            description.includes('document') ||
            description.includes('comment')
        ) {
            // If we have other actions, use their result
            if (actions.length > 0) {
                const lastAction = actions[actions.length - 1];

                if (['load_code', 'generate_code', 'optimize_code'].includes(lastAction.type)) {
                    actions.push({
                        type: 'explain_code',
                        code: '${previous_result.code || previous_result}',
                        language,
                    });
                }
            } else {
                // Otherwise, assume code is provided or referenced elsewhere
                actions.push({
                    type: 'explain_code',
                    code: '# Code to explain\nprint("Hello World")', // Placeholder code
                    language,
                });
            }
        }

        // If no actions were determined, default to code generation and execution
        if (actions.length === 0) {
            actions.push(
                {
                    type: 'generate_code',
                    problem: step.description,
                    language,
                },
                {
                    type: 'execute_code',
                    code: '${previous_result.code}',
                    language,
                    args: [],
                }
            );
        }

        // Resolve dependencies between actions
        return this.resolveActionDependencies(actions);
    }

    /**
     * Resolve dependencies between actions (e.g., replace ${previous_result} with actual references)
     */
    private resolveActionDependencies(actions: any[]): any[] {
        const resolvedActions = [...actions];

        // Loop through actions starting from the second one
        for (let i = 1; i < resolvedActions.length; i++) {
            const action = resolvedActions[i];

            // Replace ${previous_result} with a reference to the previous action
            for (const key in action) {
                if (typeof action[key] === 'string') {
                    // Handle ${previous_result.property}
                    const match = action[key].match(/\$\{previous_result\.([a-zA-Z0-9_]+)\}/);

                    if (match) {
                        action[key] = { resultFrom: i - 1, property: match[1] };
                    }
                    // Handle ${previous_result}
                    else if (action[key] === '${previous_result}') {
                        action[key] = { resultFrom: i - 1 };
                    }
                }
            }
        }

        return resolvedActions;
    }

    /**
     * Generate code for a given problem
     */
    private async generateCode(problem: string, language: string): Promise<any> {
        try {
            // Use AI service to generate code
            const code = await generateCode(problem, language);

            return {
                success: true,
                code,
                language,
            };
        } catch (error) {
            throw new Error(`Failed to generate code: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Execute code
     */
    private async executeCode(code: string, language: string, args: string[] = []): Promise<any> {
        try {
            // Execute the code
            const result = await this.codeExecutionTool.execute(code, language, { args });

            return {
                success: result.exitCode === 0,
                language,
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode,
                output: result.output,
                duration: result.duration,
            };
        } catch (error) {
            throw new Error(`Failed to execute code: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Save code to a file
     */
    private async saveCode(code: string, path: string, language: string): Promise<any> {
        try {
            // Save the code to a file
            await this.fileSystemTool.writeFile(path, Buffer.from(code, 'utf-8'));

            return {
                success: true,
                path,
                language,
                size: code.length,
            };
        } catch (error) {
            throw new Error(`Failed to save code: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Load code from a file
     */
    private async loadCode(path: string): Promise<any> {
        try {
            // Read the file
            const buffer = await this.fileSystemTool.readFile(path);
            const code = buffer.toString('utf-8');

            // Try to determine the language from the file extension
            const extension = path.split('.').pop()?.toLowerCase();
            let language = 'text';

            switch (extension) {
                case 'py':
                    language = 'python';
                    break;
                case 'js':
                    language = 'javascript';
                    break;
                case 'ts':
                    language = 'typescript';
                    break;
                case 'sh':
                case 'bash':
                    language = 'bash';
                    break;
                case 'r':
                    language = 'r';
                    break;
                case 'rb':
                    language = 'ruby';
                    break;
                case 'php':
                    language = 'php';
                    break;
            }

            return {
                success: true,
                code,
                language,
                path,
                size: code.length,
            };
        } catch (error) {
            throw new Error(`Failed to load code: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Optimize code
     */
    private async optimizeCode(code: string, language: string, criteria: string[] = []): Promise<any> {
        try {
            // Generate a prompt for optimizing the code
            const criteriaStr = criteria.join(', ');

            const prompt = `
Optimize the following ${language} code for ${criteriaStr || 'performance, readability'}.
Provide an improved version that maintains the same functionality but is better in terms of ${criteriaStr || 'performance, readability'}.

Original code:
\`\`\`${language}
${code}
\`\`\`

Please provide only the optimized code without explanations.
`;

            // Use AI service to optimize code
            const optimizedCode = await generateCode(prompt, language);

            return {
                success: true,
                code: optimizedCode,
                language,
                criteria,
            };
        } catch (error) {
            throw new Error(`Failed to optimize code: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Explain code
     */
    private async explainCode(code: string, language: string): Promise<any> {
        try {
            // Generate a prompt for explaining the code
            const prompt = `
Explain the following ${language} code in detail:

\`\`\`${language}
${code}
\`\`\`

Please provide:
1. A high-level overview of what the code does
2. Explanation of key concepts and algorithms used
3. Line-by-line explanation of important sections
4. Any potential issues or improvements
`;

            // Use AI service to explain code
            const explanation = await generateCode(prompt, 'text');

            return {
                success: true,
                code,
                language,
                explanation,
            };
        } catch (error) {
            throw new Error(`Failed to explain code: ${error instanceof Error ? error.message : String(error)}`);
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