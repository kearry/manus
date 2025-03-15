/**
 * Data Analysis Agent
 * 
 * A specialized agent for data analysis, visualization,
 * and statistical computations.
 */

import { TaskStep } from '@prisma/client';
import { BaseSpecializedAgent, AgentExecutionResult } from './base-agent';
import { CodeExecutionTool } from '../../tools/code-execution';
import { FileSystemTool } from '../../tools/filesystem';
import { generateCode } from '../../../lib/ai';

export class DataAnalysisAgent extends BaseSpecializedAgent {
    private codeExecutionTool: CodeExecutionTool;
    private fileSystemTool: FileSystemTool;

    constructor() {
        super('DataAnalysisAgent');
        this.codeExecutionTool = new CodeExecutionTool();
        this.fileSystemTool = new FileSystemTool();
    }

    /**
     * Execute a data analysis related task step
     */
    public async executeStep(step: TaskStep): Promise<AgentExecutionResult> {
        try {
            await this.logInfo(step.taskId, step.id, `DataAnalysisAgent executing step: ${step.description}`);

            // Initialize tools
            await this.codeExecutionTool.initialize();
            await this.fileSystemTool.initialize();

            // Analyze the step to determine the analysis actions needed
            const analysisActions = await this.analyzeStepForActions(step);

            // Execute each analysis action
            const results = [];

            for (const action of analysisActions) {
                await this.logInfo(step.taskId, step.id, `Executing analysis action: ${action.type}`);

                // Record tool usage start
                const toolUsageId = await this.recordToolUsageStart(
                    step.taskId,
                    'code',
                    JSON.stringify(action)
                );

                try {
                    // Execute the appropriate analysis action
                    let result;

                    switch (action.type) {
                        case 'load_data':
                            result = await this.loadData(action.source, action.format);
                            break;

                        case 'clean_data':
                            result = await this.cleanData(action.data, action.operations);
                            break;

                        case 'analyze_data':
                            result = await this.analyzeData(action.data, action.analysis);
                            break;

                        case 'visualize_data':
                            result = await this.visualizeData(action.data, action.visualization);
                            break;

                        case 'generate_report':
                            result = await this.generateReport(action.data, action.analyses, action.format);
                            break;

                        default:
                            throw new Error(`Unknown analysis action type: ${action.type}`);
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
                        `Analysis action failed: ${action.type}`,
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

        // Check for data analysis related keywords
        const dataKeywords = [
            'data', 'analysis', 'analyze', 'statistics', 'statistical',
            'visualization', 'visualize', 'chart', 'graph', 'plot',
            'excel', 'csv', 'dataset', 'pandas', 'numpy', 'correlation',
            'regression', 'mean', 'median', 'average', 'standard deviation',
        ];

        return dataKeywords.some(keyword => description.includes(keyword));
    }

    /**
     * Analyze a step description to determine what analysis actions to take
     */
    private async analyzeStepForActions(step: TaskStep): Promise<any[]> {
        const description = step.description.toLowerCase();
        const actions = [];

        // Determine if we need to load data
        if (
            description.includes('load') ||
            description.includes('read') ||
            description.includes('import') ||
            description.includes('csv') ||
            description.includes('excel') ||
            description.includes('data')
        ) {
            // Determine the data source
            let source = '/tmp/manus-sandbox/files/data.csv'; // Default source
            let format = 'csv'; // Default format

            // Try to extract the data source from the description
            if (description.includes('csv')) {
                source = '/tmp/manus-sandbox/files/data.csv';
                format = 'csv';
            } else if (description.includes('excel') || description.includes('xlsx')) {
                source = '/tmp/manus-sandbox/files/data.xlsx';
                format = 'excel';
            } else if (description.includes('json')) {
                source = '/tmp/manus-sandbox/files/data.json';
                format = 'json';
            }

            actions.push({
                type: 'load_data',
                source,
                format,
            });
        }

        // Determine if we need to clean the data
        if (
            description.includes('clean') ||
            description.includes('preprocess') ||
            description.includes('prepare') ||
            description.includes('missing') ||
            description.includes('filter')
        ) {
            const operations = [];

            if (description.includes('missing')) {
                operations.push('handle_missing_values');
            }

            if (description.includes('duplicate')) {
                operations.push('remove_duplicates');
            }

            if (description.includes('normalize') || description.includes('scale')) {
                operations.push('normalize_data');
            }

            if (description.includes('outlier')) {
                operations.push('handle_outliers');
            }

            actions.push({
                type: 'clean_data',
                operations: operations.length > 0 ? operations : ['basic_cleaning'],
                data: '${previous_result}', // Reference to previous action's output
            });
        }

        // Determine if we need to analyze the data
        if (
            description.includes('analyze') ||
            description.includes('analysis') ||
            description.includes('statistics') ||
            description.includes('statistical') ||
            description.includes('correlation') ||
            description.includes('regression')
        ) {
            const analysis = [];

            if (description.includes('descriptive') || description.includes('summary')) {
                analysis.push('descriptive_statistics');
            }

            if (description.includes('correlation')) {
                analysis.push('correlation_analysis');
            }

            if (description.includes('regression')) {
                analysis.push('regression_analysis');
            }

            if (description.includes('cluster')) {
                analysis.push('clustering');
            }

            actions.push({
                type: 'analyze_data',
                analysis: analysis.length > 0 ? analysis : ['descriptive_statistics'],
                data: '${previous_result}', // Reference to previous action's output
            });
        }

        // Determine if we need to visualize the data
        if (
            description.includes('visualize') ||
            description.includes('visualization') ||
            description.includes('chart') ||
            description.includes('graph') ||
            description.includes('plot')
        ) {
            const visualization = [];

            if (description.includes('scatter')) {
                visualization.push('scatter_plot');
            }

            if (description.includes('bar')) {
                visualization.push('bar_chart');
            }

            if (description.includes('line')) {
                visualization.push('line_chart');
            }

            if (description.includes('histogram')) {
                visualization.push('histogram');
            }

            if (description.includes('heatmap')) {
                visualization.push('heatmap');
            }

            actions.push({
                type: 'visualize_data',
                visualization: visualization.length > 0 ? visualization : ['auto_visualize'],
                data: '${previous_result}', // Reference to previous action's output
            });
        }

        // If we need to generate a report
        if (
            description.includes('report') ||
            description.includes('summary') ||
            description.includes('document') ||
            description.includes('generate')
        ) {
            let format = 'markdown';

            if (description.includes('html')) {
                format = 'html';
            } else if (description.includes('json')) {
                format = 'json';
            }

            actions.push({
                type: 'generate_report',
                format,
                data: '${previous_result}', // Reference to previous action's output
                analyses: [], // Will be filled with all analyses performed
            });
        }

        // If no actions were determined, add a default analysis workflow
        if (actions.length === 0) {
            actions.push(
                {
                    type: 'load_data',
                    source: '/tmp/manus-sandbox/files/data.csv',
                    format: 'csv',
                },
                {
                    type: 'clean_data',
                    operations: ['basic_cleaning'],
                    data: '${previous_result}',
                },
                {
                    type: 'analyze_data',
                    analysis: ['descriptive_statistics'],
                    data: '${previous_result}',
                },
                {
                    type: 'visualize_data',
                    visualization: ['auto_visualize'],
                    data: '${previous_result}',
                },
                {
                    type: 'generate_report',
                    format: 'markdown',
                    data: '${previous_result}',
                    analyses: [],
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

            // For generate_report action, add references to all analyses
            if (action.type === 'generate_report' && Array.isArray(action.analyses) && action.analyses.length === 0) {
                for (let j = 0; j < i; j++) {
                    if (resolvedActions[j].type === 'analyze_data' || resolvedActions[j].type === 'visualize_data') {
                        action.analyses.push({ resultFrom: j });
                    }
                }
            }
        }

        return resolvedActions;
    }

    /**
     * Load data from a file
     */
    private async loadData(source: string, format: string): Promise<any> {
        // Generate Python code for loading the data
        const loadCode = await this.generateLoadDataCode(source, format);

        // Execute the code
        const result = await this.codeExecutionTool.execute(loadCode, 'python');

        if (result.exitCode !== 0) {
            throw new Error(`Failed to load data: ${result.stderr}`);
        }

        return result.output || result.stdout;
    }

    /**
     * Clean data
     */
    private async cleanData(data: any, operations: string[]): Promise<any> {
        // Generate Python code for cleaning the data
        const cleanCode = await this.generateCleanDataCode(data, operations);

        // Execute the code
        const result = await this.codeExecutionTool.execute(cleanCode, 'python');

        if (result.exitCode !== 0) {
            throw new Error(`Failed to clean data: ${result.stderr}`);
        }

        return result.output || result.stdout;
    }

    /**
     * Analyze data
     */
    private async analyzeData(data: any, analyses: string[]): Promise<any> {
        // Generate Python code for analyzing the data
        const analysisCode = await this.generateAnalysisCode(data, analyses);

        // Execute the code
        const result = await this.codeExecutionTool.execute(analysisCode, 'python');

        if (result.exitCode !== 0) {
            throw new Error(`Failed to analyze data: ${result.stderr}`);
        }

        return result.output || result.stdout;
    }

    /**
     * Visualize data
     */
    private async visualizeData(data: any, visualizations: string[]): Promise<any> {
        // Generate Python code for visualizing the data
        const visualizationCode = await this.generateVisualizationCode(data, visualizations);

        // Execute the code
        const result = await this.codeExecutionTool.execute(visualizationCode, 'python');

        if (result.exitCode !== 0) {
            throw new Error(`Failed to visualize data: ${result.stderr}`);
        }

        // Save visualization files if any were created
        // In a real implementation, we would parse the output to find file paths
        // and handle them appropriately

        return result.output || result.stdout;
    }

    /**
     * Generate a report
     */
    private async generateReport(data: any, analyses: any[], format: string): Promise<any> {
        // Generate Python code for creating a report
        const reportCode = await this.generateReportCode(data, analyses, format);

        // Execute the code
        const result = await this.codeExecutionTool.execute(reportCode, 'python');

        if (result.exitCode !== 0) {
            throw new Error(`Failed to generate report: ${result.stderr}`);
        }

        return result.output || result.stdout;
    }

    /**
     * Generate Python code for loading data
     */
    private async generateLoadDataCode(source: string, format: string): Promise<string> {
        const problem = `
Load data from '${source}' in ${format} format. 
Return the data as a JSON string with a 'data' key containing the first 5 rows for preview,
and a 'metadata' key containing information about the columns and the total number of rows.
`;

        return await generateCode(problem, 'python');
    }

    /**
     * Generate Python code for cleaning data
     */
    private async generateCleanDataCode(data: any, operations: string[]): Promise<string> {
        const problem = `
Clean the provided data with the following operations: ${operations.join(', ')}.
The data is provided as a JSON string with the structure from the previous operation.
Return the cleaned data as a JSON string with a 'data' key containing the first 5 rows for preview,
and a 'metadata' key with information about what was cleaned.
`;

        return await generateCode(problem, 'python');
    }

    /**
     * Generate Python code for analyzing data
     */
    private async generateAnalysisCode(data: any, analyses: string[]): Promise<string> {
        const problem = `
Analyze the provided data with the following analyses: ${analyses.join(', ')}.
The data is provided as a JSON string with the structure from the previous operation.
Return the analysis results as a JSON string with appropriate keys for each analysis type.
`;

        return await generateCode(problem, 'python');
    }

    /**
     * Generate Python code for visualizing data
     */
    private async generateVisualizationCode(data: any, visualizations: string[]): Promise<string> {
        const problem = `
Create visualizations of the provided data: ${visualizations.join(', ')}.
The data is provided as a JSON string with the structure from the previous operation.
Save visualization as PNG files to the '/tmp/manus-sandbox/files/' directory.
Return a JSON string with the paths to the created visualization files and metadata about each visualization.
`;

        return await generateCode(problem, 'python');
    }

    /**
     * Generate Python code for creating a report
     */
    private async generateReportCode(data: any, analyses: any[], format: string): Promise<string> {
        const problem = `
Generate a comprehensive ${format} report based on the data and analyses provided.
The data and analyses are provided as JSON strings from previous operations.
The report should include an executive summary, methodology, key findings, and visualizations.
Return the report content as a string in ${format} format.
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