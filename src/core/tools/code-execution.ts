/**
 * Code Execution Tool
 * 
 * Provides a secure environment for executing code in various languages.
 */

import { BaseTool } from './index';
import { ShellTool } from './shell';
import { FileSystemTool } from './filesystem';

export interface CodeExecutionResult {
    language: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
    output?: any; // Parsed output if available
}

export interface CodeExecutionOptions {
    timeout?: number;
    memoryLimit?: number;
    allowedLanguages?: string[];
    args?: string[];
    env?: Record<string, string>;
}

export class CodeExecutionTool implements BaseTool {
    public name: string = 'code';
    public description: string = 'Executes code in various languages in a secure sandbox environment';

    private shellTool: ShellTool;
    private fileSystemTool: FileSystemTool;

    private options: CodeExecutionOptions = {
        timeout: 30000, // 30 seconds
        memoryLimit: 512, // 512MB
        allowedLanguages: [
            'python', 'javascript', 'typescript', 'node', 'bash', 'r', 'ruby', 'php',
        ],
        env: {
            'PATH': '/usr/local/bin:/usr/bin:/bin',
            'PYTHONPATH': '/tmp/manus-sandbox/libs/python',
            'NODE_PATH': '/tmp/manus-sandbox/libs/node',
        },
    };

    constructor(
        options: CodeExecutionOptions = {},
        shellTool?: ShellTool,
        fileSystemTool?: FileSystemTool
    ) {
        this.options = { ...this.options, ...options };
        this.shellTool = shellTool || new ShellTool();
        this.fileSystemTool = fileSystemTool || new FileSystemTool();
    }

    /**
     * Initialize the code execution environment
     */
    public async initialize(): Promise<void> {
        await this.shellTool.initialize();
        await this.fileSystemTool.initialize();

        // Set up directories for code execution
        try {
            await this.fileSystemTool.mkdir('/tmp/manus-sandbox/code');
        } catch (error) {
            // Directory might already exist
        }
    }

    /**
     * Execute code in a specific language
     */
    public async execute(
        code: string,
        language: string,
        options: CodeExecutionOptions = {}
    ): Promise<CodeExecutionResult> {
        const mergedOptions = { ...this.options, ...options };

        // Check if language is allowed
        if (
            mergedOptions.allowedLanguages &&
            !mergedOptions.allowedLanguages.includes(language)
        ) {
            throw new Error(`Language not allowed: ${language}`);
        }

        // Create a file with the code
        const fileName = await this.createCodeFile(code, language);

        // Build the execution command
        const command = this.buildExecutionCommand(fileName, language, mergedOptions);

        // Execute the command
        const startTime = Date.now();
        const result = await this.shellTool.execute(command);
        const endTime = Date.now();

        // Parse output if possible
        let parsedOutput: any = undefined;
        try {
            // For JSON output, try to parse it
            if (result.stdout.trim().startsWith('{') || result.stdout.trim().startsWith('[')) {
                parsedOutput = JSON.parse(result.stdout);
            }
        } catch (error) {
            // Ignore parsing errors
        }

        return {
            language,
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
            duration: endTime - startTime,
            output: parsedOutput,
        };
    }

    /**
     * Execute a function on data and return the result
     */
    public async executeFunction(
        functionCode: string,
        language: string,
        data: any,
        options: CodeExecutionOptions = {}
    ): Promise<CodeExecutionResult> {
        // Generate wrapper code that calls the function with the data
        const wrappedCode = this.wrapFunctionCode(functionCode, language, data);

        // Execute the wrapped code
        return this.execute(wrappedCode, language, options);
    }

    /**
     * Clean up resources
     */
    public async cleanup(): Promise<void> {
        await this.shellTool.cleanup();
        await this.fileSystemTool.cleanup();
    }

    /**
     * Create a file with the code to execute
     */
    private async createCodeFile(code: string, language: string): Promise<string> {
        const extension = this.getFileExtension(language);
        const fileName = `/tmp/manus-sandbox/code/script_${Date.now()}.${extension}`;

        await this.fileSystemTool.writeFile(fileName, Buffer.from(code));

        return fileName;
    }

    /**
     * Build the command to execute the code
     */
    private buildExecutionCommand(
        fileName: string,
        language: string,
        options: CodeExecutionOptions
    ): string {
        const args = options.args ? options.args.join(' ') : '';

        switch (language.toLowerCase()) {
            case 'python':
            case 'python3':
                return `python3 ${fileName} ${args}`;

            case 'javascript':
            case 'js':
            case 'node':
                return `node ${fileName} ${args}`;

            case 'typescript':
            case 'ts':
                return `ts-node ${fileName} ${args}`;

            case 'bash':
            case 'shell':
                return `bash ${fileName} ${args}`;

            case 'r':
                return `Rscript ${fileName} ${args}`;

            case 'ruby':
                return `ruby ${fileName} ${args}`;

            case 'php':
                return `php ${fileName} ${args}`;

            default:
                throw new Error(`Unsupported language: ${language}`);
        }
    }

    /**
     * Wrap function code with code that calls it with data
     */
    private wrapFunctionCode(functionCode: string, language: string, data: any): string {
        const jsonData = JSON.stringify(data);

        switch (language.toLowerCase()) {
            case 'python':
            case 'python3':
                return `
${functionCode}

import json
import sys

# Parse input data
data = json.loads('''${jsonData}''')

# Call the function with the data
result = None
try:
    # Assume the function name is 'process' if not explicitly defined
    if 'process' in locals():
        result = process(data)
    else:
        # Try to find the function by looking for def statements
        import re
        match = re.search(r'def\\s+([a-zA-Z0-9_]+)\\s*\\(', '''${functionCode}''')
        if match:
            func_name = match.group(1)
            result = locals()[func_name](data)
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)

# Output the result as JSON
print(json.dumps(result))
`;

            case 'javascript':
            case 'js':
            case 'node':
                return `
${functionCode}

// Parse input data
const data = ${jsonData};

// Call the function with the data
let result;
try {
    // Assume the function name is 'process' if not explicitly defined
    if (typeof process === 'function') {
        result = process(data);
    } else {
        // Try to find the function by looking for function declarations
        const match = \`${functionCode}\`.match(/function\\s+([a-zA-Z0-9_]+)\\s*\\(/);
        if (match) {
            const funcName = match[1];
            result = eval(\`\${funcName}(data)\`);
        }
    }
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}

// Output the result as JSON
console.log(JSON.stringify(result));
`;

            default:
                throw new Error(`Wrapping function not supported for language: ${language}`);
        }
    }

    /**
     * Get file extension for a language
     */
    private getFileExtension(language: string): string {
        switch (language.toLowerCase()) {
            case 'python':
            case 'python3':
                return 'py';

            case 'javascript':
            case 'js':
            case 'node':
                return 'js';

            case 'typescript':
            case 'ts':
                return 'ts';

            case 'bash':
            case 'shell':
                return 'sh';

            case 'r':
                return 'r';

            case 'ruby':
                return 'rb';

            case 'php':
                return 'php';

            default:
                return 'txt';
        }
    }
}