/**
 * Document Processing Agent
 * 
 * A specialized agent for document creation, processing, and manipulation.
 */

import { TaskStep } from '@prisma/client';
import { BaseSpecializedAgent, AgentExecutionResult } from './base-agent';
import { FileSystemTool } from '../../tools/filesystem';
import { CodeExecutionTool } from '../../tools/code-execution';
import { generateCode } from '../../../lib/ai';

export class DocumentProcessingAgent extends BaseSpecializedAgent {
    private fileSystemTool: FileSystemTool;
    private codeExecutionTool: CodeExecutionTool;

    constructor() {
        super('DocumentProcessingAgent');
        this.fileSystemTool = new FileSystemTool();
        this.codeExecutionTool = new CodeExecutionTool();
    }

    /**
     * Execute a document processing related task step
     */
    public async executeStep(step: TaskStep): Promise<AgentExecutionResult> {
        try {
            await this.logInfo(step.taskId, step.id, `DocumentProcessingAgent executing step: ${step.description}`);

            // Initialize tools
            await this.fileSystemTool.initialize();
            await this.codeExecutionTool.initialize();

            // Analyze the step to determine the document actions needed
            const documentActions = await this.analyzeStepForActions(step);

            // Execute each document action
            const results = [];

            for (const action of documentActions) {
                await this.logInfo(step.taskId, step.id, `Executing document action: ${action.type}`);

                // Record tool usage start
                const toolUsageId = await this.recordToolUsageStart(
                    step.taskId,
                    'filesystem',
                    JSON.stringify(action)
                );

                try {
                    // Execute the appropriate document action
                    let result;

                    switch (action.type) {
                        case 'read_document':
                            result = await this.readDocument(action.path, action.format);
                            break;

                        case 'create_document':
                            result = await this.createDocument(action.content, action.path, action.format);
                            break;

                        case 'update_document':
                            result = await this.updateDocument(action.path, action.changes, action.format);
                            break;

                        case 'merge_documents':
                            result = await this.mergeDocuments(action.paths, action.outputPath, action.format);
                            break;

                        case 'extract_content':
                            result = await this.extractContent(action.path, action.query, action.format);
                            break;

                        case 'convert_document':
                            result = await this.convertDocument(action.inputPath, action.outputPath, action.fromFormat, action.toFormat);
                            break;

                        default:
                            throw new Error(`Unknown document action type: ${action.type}`);
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
                        `Document action failed: ${action.type}`,
                        { error: error instanceof Error ? error.message : String(error) }
                    );
                }
            }

            // Clean up resources
            await this.fileSystemTool.cleanup();
            await this.codeExecutionTool.cleanup();

            // Return success with the collected results
            return {
                success: true,
                output: results,
            };
        } catch (error) {
            // Make sure resources are cleaned up
            try {
                await this.fileSystemTool.cleanup();
                await this.codeExecutionTool.cleanup();
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

        // Check for document processing related keywords
        const documentKeywords = [
            'document', 'file', 'text', 'pdf', 'word', 'docx', 'excel', 'xlsx',
            'read', 'write', 'create', 'update', 'merge', 'extract', 'convert',
            'report', 'template', 'format', 'markdown', 'html', 'text',
        ];

        return documentKeywords.some(keyword => description.includes(keyword));
    }

    /**
     * Analyze a step description to determine what document actions to take
     */
    private async analyzeStepForActions(step: TaskStep): Promise<any[]> {
        const description = step.description.toLowerCase();
        const actions = [];

        // Check for read actions
        if (
            description.includes('read') ||
            description.includes('open') ||
            description.includes('load') ||
            description.includes('import')
        ) {
            // Try to determine the file path and format
            let path = '/tmp/manus-sandbox/files/document.txt';
            let format = 'text';

            if (description.includes('pdf')) {
                path = '/tmp/manus-sandbox/files/document.pdf';
                format = 'pdf';
            } else if (description.includes('docx') || description.includes('word')) {
                path = '/tmp/manus-sandbox/files/document.docx';
                format = 'docx';
            } else if (description.includes('xlsx') || description.includes('excel')) {
                path = '/tmp/manus-sandbox/files/document.xlsx';
                format = 'xlsx';
            } else if (description.includes('csv')) {
                path = '/tmp/manus-sandbox/files/document.csv';
                format = 'csv';
            } else if (description.includes('markdown') || description.includes('md')) {
                path = '/tmp/manus-sandbox/files/document.md';
                format = 'markdown';
            } else if (description.includes('html')) {
                path = '/tmp/manus-sandbox/files/document.html';
                format = 'html';
            }

            actions.push({
                type: 'read_document',
                path,
                format,
            });
        }

        // Check for create actions
        if (
            description.includes('create') ||
            description.includes('write') ||
            description.includes('generate') ||
            description.includes('new')
        ) {
            // Try to determine the file path and format
            let path = '/tmp/manus-sandbox/files/output.txt';
            let format = 'text';

            if (description.includes('pdf')) {
                path = '/tmp/manus-sandbox/files/output.pdf';
                format = 'pdf';
            } else if (description.includes('docx') || description.includes('word')) {
                path = '/tmp/manus-sandbox/files/output.docx';
                format = 'docx';
            } else if (description.includes('xlsx') || description.includes('excel')) {
                path = '/tmp/manus-sandbox/files/output.xlsx';
                format = 'xlsx';
            } else if (description.includes('csv')) {
                path = '/tmp/manus-sandbox/files/output.csv';
                format = 'csv';
            } else if (description.includes('markdown') || description.includes('md')) {
                path = '/tmp/manus-sandbox/files/output.md';
                format = 'markdown';
            } else if (description.includes('html')) {
                path = '/tmp/manus-sandbox/files/output.html';
                format = 'html';
            }

            actions.push({
                type: 'create_document',
                path,
                format,
                content: '${previous_result}', // Content from previous action
            });
        }

        // Check for update actions
        if (
            description.includes('update') ||
            description.includes('modify') ||
            description.includes('edit') ||
            description.includes('change')
        ) {
            // Try to determine the file path and format
            let path = '/tmp/manus-sandbox/files/document.txt';
            let format = 'text';

            if (description.includes('pdf')) {
                path = '/tmp/manus-sandbox/files/document.pdf';
                format = 'pdf';
            } else if (description.includes('docx') || description.includes('word')) {
                path = '/tmp/manus-sandbox/files/document.docx';
                format = 'docx';
            } else if (description.includes('xlsx') || description.includes('excel')) {
                path = '/tmp/manus-sandbox/files/document.xlsx';
                format = 'xlsx';
            } else if (description.includes('csv')) {
                path = '/tmp/manus-sandbox/files/document.csv';
                format = 'csv';
            } else if (description.includes('markdown') || description.includes('md')) {
                path = '/tmp/manus-sandbox/files/document.md';
                format = 'markdown';
            } else if (description.includes('html')) {
                path = '/tmp/manus-sandbox/files/document.html';
                format = 'html';
            }

            actions.push({
                type: 'update_document',
                path,
                format,
                changes: '${previous_result}', // Changes from previous action
            });
        }

        // Check for merge actions
        if (
            description.includes('merge') ||
            description.includes('combine') ||
            description.includes('concatenate') ||
            description.includes('join')
        ) {
            // Try to determine file paths and format
            const paths = [
                '/tmp/manus-sandbox/files/document1.txt',
                '/tmp/manus-sandbox/files/document2.txt',
            ];
            let outputPath = '/tmp/manus-sandbox/files/merged.txt';
            let format = 'text';

            if (description.includes('pdf')) {
                paths[0] = '/tmp/manus-sandbox/files/document1.pdf';
                paths[1] = '/tmp/manus-sandbox/files/document2.pdf';
                outputPath = '/tmp/manus-sandbox/files/merged.pdf';
                format = 'pdf';
            } else if (description.includes('docx') || description.includes('word')) {
                paths[0] = '/tmp/manus-sandbox/files/document1.docx';
                paths[1] = '/tmp/manus-sandbox/files/document2.docx';
                outputPath = '/tmp/manus-sandbox/files/merged.docx';
                format = 'docx';
            } else if (description.includes('markdown') || description.includes('md')) {
                paths[0] = '/tmp/manus-sandbox/files/document1.md';
                paths[1] = '/tmp/manus-sandbox/files/document2.md';
                outputPath = '/tmp/manus-sandbox/files/merged.md';
                format = 'markdown';
            }

            actions.push({
                type: 'merge_documents',
                paths,
                outputPath,
                format,
            });
        }

        // Check for extract actions
        if (
            description.includes('extract') ||
            description.includes('pull') ||
            description.includes('find') ||
            description.includes('search')
        ) {
            // Try to determine the file path, query, and format
            let path = '/tmp/manus-sandbox/files/document.txt';
            let format = 'text';
            let query = ''; // Depends on what's being extracted

            if (description.includes('pdf')) {
                path = '/tmp/manus-sandbox/files/document.pdf';
                format = 'pdf';
            } else if (description.includes('docx') || description.includes('word')) {
                path = '/tmp/manus-sandbox/files/document.docx';
                format = 'docx';
            } else if (description.includes('xlsx') || description.includes('excel')) {
                path = '/tmp/manus-sandbox/files/document.xlsx';
                format = 'xlsx';
            }

            actions.push({
                type: 'extract_content',
                path,
                format,
                query,
            });
        }

        // Check for convert actions
        if (
            description.includes('convert') ||
            description.includes('transform') ||
            description.includes('change format')
        ) {
            // Try to determine the file paths and formats
            let inputPath = '/tmp/manus-sandbox/files/document.txt';
            let outputPath = '/tmp/manus-sandbox/files/converted.pdf';
            let fromFormat = 'text';
            let toFormat = 'pdf';

            if (description.includes('markdown to html') || description.includes('md to html')) {
                inputPath = '/tmp/manus-sandbox/files/document.md';
                outputPath = '/tmp/manus-sandbox/files/converted.html';
                fromFormat = 'markdown';
                toFormat = 'html';
            } else if (description.includes('docx to pdf') || description.includes('word to pdf')) {
                inputPath = '/tmp/manus-sandbox/files/document.docx';
                outputPath = '/tmp/manus-sandbox/files/converted.pdf';
                fromFormat = 'docx';
                toFormat = 'pdf';
            } else if (description.includes('csv to excel') || description.includes('csv to xlsx')) {
                inputPath = '/tmp/manus-sandbox/files/document.csv';
                outputPath = '/tmp/manus-sandbox/files/converted.xlsx';
                fromFormat = 'csv';
                toFormat = 'xlsx';
            }

            actions.push({
                type: 'convert_document',
                inputPath,
                outputPath,
                fromFormat,
                toFormat,
            });
        }

        // If no actions were determined, add default actions based on the step description
        if (actions.length === 0) {
            // Default to reading a text document and creating a new one
            actions.push(
                {
                    type: 'read_document',
                    path: '/tmp/manus-sandbox/files/document.txt',
                    format: 'text',
                },
                {
                    type: 'create_document',
                    path: '/tmp/manus-sandbox/files/output.txt',
                    format: 'text',
                    content: '${previous_result}',
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
                if (typeof action[key] === 'string' && action[key] === '${previous_result}') {
                    action[key] = { resultFrom: i - 1 };
                }
            }
        }

        return resolvedActions;
    }

    /**
     * Read a document
     */
    private async readDocument(path: string, format: string): Promise<any> {
        try {
            // Read the file
            const content = await this.fileSystemTool.readFile(path);

            // For text-based formats, convert to string
            if (['text', 'markdown', 'html', 'csv'].includes(format)) {
                return {
                    content: content.toString('utf-8'),
                    format,
                    path,
                };
            }

            // For binary formats, we need special handling
            // In a real implementation, we would use appropriate libraries
            // For now, just return a simple representation
            return {
                content: `Binary ${format.toUpperCase()} file, size: ${content.length} bytes`,
                format,
                path,
                raw: content,
            };
        } catch (error) {
            throw new Error(`Failed to read document: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Create a document
     */
    private async createDocument(content: any, path: string, format: string): Promise<any> {
        try {
            // Ensure content is a string
            let contentStr = '';

            if (typeof content === 'string') {
                contentStr = content;
            } else if (typeof content === 'object') {
                contentStr = JSON.stringify(content, null, 2);
            } else {
                contentStr = String(content);
            }

            // For text-based formats, write directly
            if (['text', 'markdown', 'html', 'csv'].includes(format)) {
                await this.fileSystemTool.writeFile(path, Buffer.from(contentStr, 'utf-8'));
                return {
                    success: true,
                    path,
                    format,
                    size: contentStr.length,
                };
            }

            // For binary formats, generate appropriate file using code execution
            // In a real implementation, we would use libraries like docx, pdfkit, etc.
            const code = await this.generateDocumentCreationCode(contentStr, path, format);
            const result = await this.codeExecutionTool.execute(code, 'python');

            if (result.exitCode !== 0) {
                throw new Error(`Code execution failed: ${result.stderr}`);
            }

            return {
                success: true,
                path,
                format,
                executionResult: result.stdout,
            };
        } catch (error) {
            throw new Error(`Failed to create document: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update a document
     */
    private async updateDocument(path: string, changes: any, format: string): Promise<any> {
        try {
            // Read the existing document
            const existing = await this.readDocument(path, format);

            // Apply changes - implementation depends on the format
            // For text-based formats, we can use string operations
            if (['text', 'markdown', 'html', 'csv'].includes(format)) {
                let updatedContent = existing.content;

                if (typeof changes === 'string') {
                    // If changes is a string, append it
                    updatedContent += '\n' + changes;
                } else if (typeof changes === 'object' && changes.find && changes.replace) {
                    // If changes has find/replace properties, do replacement
                    updatedContent = updatedContent.replace(changes.find, changes.replace);
                }

                // Write back the updated content
                await this.fileSystemTool.writeFile(path, Buffer.from(updatedContent, 'utf-8'));

                return {
                    success: true,
                    path,
                    format,
                    size: updatedContent.length,
                };
            }

            // For binary formats, use code execution
            const code = await this.generateDocumentUpdateCode(path, changes, format);
            const result = await this.codeExecutionTool.execute(code, 'python');

            if (result.exitCode !== 0) {
                throw new Error(`Code execution failed: ${result.stderr}`);
            }

            return {
                success: true,
                path,
                format,
                executionResult: result.stdout,
            };
        } catch (error) {
            throw new Error(`Failed to update document: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Merge documents
     */
    private async mergeDocuments(paths: string[], outputPath: string, format: string): Promise<any> {
        try {
            // For text-based formats, concatenate content
            if (['text', 'markdown', 'html', 'csv'].includes(format)) {
                const contents = [];

                for (const path of paths) {
                    const doc = await this.readDocument(path, format);
                    contents.push(doc.content);
                }

                const merged = contents.join('\n\n');
                await this.fileSystemTool.writeFile(outputPath, Buffer.from(merged, 'utf-8'));

                return {
                    success: true,
                    outputPath,
                    format,
                    size: merged.length,
                    sourceCount: paths.length,
                };
            }

            // For binary formats, use code execution
            const code = await this.generateDocumentMergeCode(paths, outputPath, format);
            const result = await this.codeExecutionTool.execute(code, 'python');

            if (result.exitCode !== 0) {
                throw new Error(`Code execution failed: ${result.stderr}`);
            }

            return {
                success: true,
                outputPath,
                format,
                executionResult: result.stdout,
                sourceCount: paths.length,
            };
        } catch (error) {
            throw new Error(`Failed to merge documents: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Extract content from a document
     */
    private async extractContent(path: string, query: string, format: string): Promise<any> {
        try {
            // For text-based formats, use regex or simple search
            if (['text', 'markdown', 'html', 'csv'].includes(format)) {
                const doc = await this.readDocument(path, format);

                let extracted = '';

                if (query) {
                    // Try to use query as regex
                    try {
                        const regex = new RegExp(query);
                        const matches = doc.content.match(regex);

                        if (matches && matches.length > 0) {
                            extracted = matches.join('\n');
                        }
                    } catch (regexError) {
                        // If regex fails, use simple string search
                        if (doc.content.includes(query)) {
                            // Extract surrounding context
                            const index = doc.content.indexOf(query);
                            const start = Math.max(0, index - 100);
                            const end = Math.min(doc.content.length, index + query.length + 100);
                            extracted = doc.content.substring(start, end);
                        }
                    }
                } else {
                    // Without a query, extract a summary or preview
                    extracted = doc.content.substring(0, 500) + (doc.content.length > 500 ? '...' : '');
                }

                return {
                    success: true,
                    extracted,
                    format,
                    query: query || 'preview',
                };
            }

            // For binary formats, use code execution
            const code = await this.generateContentExtractionCode(path, query, format);
            const result = await this.codeExecutionTool.execute(code, 'python');

            if (result.exitCode !== 0) {
                throw new Error(`Code execution failed: ${result.stderr}`);
            }

            return {
                success: true,
                extracted: result.stdout,
                format,
                query: query || 'all',
            };
        } catch (error) {
            throw new Error(`Failed to extract content: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Convert a document from one format to another
     */
    private async convertDocument(inputPath: string, outputPath: string, fromFormat: string, toFormat: string): Promise<any> {
        try {
            // For simple text-based format conversions, handle directly
            if (
                ['text', 'markdown', 'html'].includes(fromFormat) &&
                ['text', 'markdown', 'html'].includes(toFormat)
            ) {
                const doc = await this.readDocument(inputPath, fromFormat);

                // Simple conversion logic
                let converted = doc.content;

                if (fromFormat === 'markdown' && toFormat === 'html') {
                    // Convert markdown to HTML
                    // In a real implementation, use a proper markdown parser
                    converted = this.simpleMarkdownToHtml(doc.content);
                } else if (fromFormat === 'html' && toFormat === 'markdown') {
                    // Convert HTML to markdown
                    converted = this.simpleHtmlToMarkdown(doc.content);
                }

                await this.fileSystemTool.writeFile(outputPath, Buffer.from(converted, 'utf-8'));

                return {
                    success: true,
                    inputPath,
                    outputPath,
                    fromFormat,
                    toFormat,
                    size: converted.length,
                };
            }

            // For more complex conversions, use code execution
            const code = await this.generateDocumentConversionCode(inputPath, outputPath, fromFormat, toFormat);
            const result = await this.codeExecutionTool.execute(code, 'python');

            if (result.exitCode !== 0) {
                throw new Error(`Code execution failed: ${result.stderr}`);
            }

            return {
                success: true,
                inputPath,
                outputPath,
                fromFormat,
                toFormat,
                executionResult: result.stdout,
            };
        } catch (error) {
            throw new Error(`Failed to convert document: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Very simple markdown to HTML converter for demonstration
     */
    private simpleMarkdownToHtml(markdown: string): string {
        let html = markdown;

        // Headers
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

        // Bold and italic
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Lists
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.+<\/li>\n)+/g, '<ul>$&</ul>');

        // Paragraphs
        html = html.replace(/^(?!<[a-z]).+$/gm, '<p>$&</p>');

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Converted Document</title>
</head>
<body>
${html}
</body>
</html>`;
    }

    /**
     * Very simple HTML to markdown converter for demonstration
     */
    private simpleHtmlToMarkdown(html: string): string {
        let markdown = html;

        // Remove HTML, head, and body tags
        markdown = markdown.replace(/<\/?html[^>]*>/g, '');
        markdown = markdown.replace(/<head>[\s\S]*?<\/head>/g, '');
        markdown = markdown.replace(/<\/?body[^>]*>/g, '');

        // Headers
        markdown = markdown.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, '# $1\n');
        markdown = markdown.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '## $1\n');
        markdown = markdown.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '### $1\n');

        // Bold and italic
        markdown = markdown.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, '**$1**');
        markdown = markdown.replace(/<em[^>]*>([\s\S]*?)<\/em>/g, '*$1*');
        markdown = markdown.replace(/<b[^>]*>([\s\S]*?)<\/b>/g, '**$1**');
        markdown = markdown.replace(/<i[^>]*>([\s\S]*?)<\/i>/g, '*$1*');

        // Lists
        markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, '$1\n');
        markdown = markdown.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, '- $1\n');

        // Paragraphs
        markdown = markdown.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '$1\n\n');

        // Remove remaining tags
        markdown = markdown.replace(/<[^>]+>/g, '');

        // Clean up extra whitespace
        markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');

        return markdown.trim();
    }

    /**
     * Generate Python code for creating a document
     */
    private async generateDocumentCreationCode(content: string, path: string, format: string): Promise<string> {
        const escapedContent = content.replace(/'/g, "\\'").replace(/\n/g, "\\n");

        const problem = `
Write Python code to create a ${format.toUpperCase()} document with the following content:
'''
${escapedContent.substring(0, 1000)}${escapedContent.length > 1000 ? '...' : ''}
'''

Save the document to '${path}'.
`;

        return await generateCode(problem, 'python');
    }

    /**
     * Generate Python code for updating a document
     */
    private async generateDocumentUpdateCode(path: string, changes: any, format: string): Promise<string> {
        let changesDescription = '';

        if (typeof changes === 'string') {
            changesDescription = `Append the following content:\n'''${changes.substring(0, 1000)}${changes.length > 1000 ? '...' : ''}'''`;
        } else if (typeof changes === 'object') {
            changesDescription = `Make these changes: ${JSON.stringify(changes)}`;
        }

        const problem = `
Write Python code to update a ${format.toUpperCase()} document at '${path}'.
${changesDescription}

Read the existing file, make the modifications, and save it back to the same path.
`;

        return await generateCode(problem, 'python');
    }

    /**
     * Generate Python code for merging documents
     */
    private async generateDocumentMergeCode(paths: string[], outputPath: string, format: string): Promise<string> {
        const problem = `
Write Python code to merge multiple ${format.toUpperCase()} documents into a single file.

Input files:
${paths.map(path => `- '${path}'`).join('\n')}

Save the merged document to '${outputPath}'.
`;

        return await generateCode(problem, 'python');
    }

    /**
     * Generate Python code for extracting content from a document
     */
    private async generateContentExtractionCode(path: string, query: string, format: string): Promise<string> {
        const problem = `
Write Python code to extract content from a ${format.toUpperCase()} document at '${path}'.
${query ? `Extract content matching: '${query}'` : 'Extract all content or a summary'}

Return the extracted content as text.
`;

        return await generateCode(problem, 'python');
    }

    /**
     * Generate Python code for converting a document between formats
     */
    private async generateDocumentConversionCode(inputPath: string, outputPath: string, fromFormat: string, toFormat: string): Promise<string> {
        const problem = `
Write Python code to convert a document from ${fromFormat.toUpperCase()} to ${toFormat.toUpperCase()}.

Input file: '${inputPath}'
Output file: '${outputPath}'

Ensure the content is properly converted with appropriate formatting.
`;

        return await generateCode(problem, 'python');
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