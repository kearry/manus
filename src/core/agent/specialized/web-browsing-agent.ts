/**
 * Web Browsing Agent
 * 
 * A specialized agent for web browsing, information retrieval,
 * and web automation tasks.
 */

import { TaskStep } from '@prisma/client';
import { BaseSpecializedAgent, AgentExecutionResult } from './base-agent';
import { BrowserTool } from '../../tools/browser';

export class WebBrowsingAgent extends BaseSpecializedAgent {
    private browserTool: BrowserTool;

    constructor() {
        super('WebBrowsingAgent');
        this.browserTool = new BrowserTool();
    }

    /**
     * Execute a web browsing related task step
     */
    public async executeStep(step: TaskStep): Promise<AgentExecutionResult> {
        try {
            await this.logInfo(step.taskId, step.id, `WebBrowsingAgent executing step: ${step.description}`);

            // Analyze the step description to determine what web browsing actions are needed
            const actions = await this.analyzeStepToActions(step);

            // Initialize the browser tool
            await this.browserTool.initialize();

            // Execute each action in sequence
            const results = [];
            for (const action of actions) {
                await this.logInfo(step.taskId, step.id, `Executing web action: ${action.type}`);

                // Record tool usage start
                const toolUsageId = await this.recordToolUsageStart(
                    step.taskId,
                    'browser',
                    JSON.stringify(action)
                );

                try {
                    // Execute the appropriate browser action
                    let result;
                    switch (action.type) {
                        case 'navigate':
                            result = await this.browserTool.navigate(action.url);
                            break;

                        case 'search':
                            result = await this.browserTool.search(action.query);
                            break;

                        case 'extract':
                            result = await this.browserTool.extractContent(action.selector);
                            break;

                        case 'click':
                            result = await this.browserTool.click(action.selector);
                            break;

                        case 'fill':
                            result = await this.browserTool.fillForm(
                                action.selector,
                                action.value
                            );
                            break;

                        case 'screenshot':
                            result = await this.browserTool.takeScreenshot();
                            break;

                        default:
                            throw new Error(`Unknown browser action type: ${action.type}`);
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
                        `Web action failed: ${action.type}`,
                        { error: error instanceof Error ? error.message : String(error) }
                    );
                }
            }

            // Close the browser
            await this.browserTool.close();

            // Return success with the collected results
            return {
                success: true,
                output: results,
            };
        } catch (error) {
            // Make sure browser is closed in case of errors
            try {
                await this.browserTool.close();
            } catch (closeError) {
                // Ignore errors when closing
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

        // Check for web browsing related keywords
        const webKeywords = [
            'web', 'browse', 'browser', 'website', 'url', 'http', 'search',
            'navigate', 'visit', 'page', 'internet', 'online', 'google',
            'download', 'scrape', 'extract'
        ];

        return webKeywords.some(keyword => description.includes(keyword));
    }

    /**
     * Analyze a step description to determine what browser actions to take
     */
    private async analyzeStepToActions(step: TaskStep): Promise<any[]> {
        // In a real implementation, this would use NLP to interpret the step
        // For now, we'll use a simplified approach based on keywords

        const description = step.description.toLowerCase();
        const actions = [];

        // Extract URLs from the description
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = description.match(urlRegex) || [];

        if (urls.length > 0) {
            // If URLs are explicitly mentioned, navigate to them
            for (const url of urls) {
                actions.push({
                    type: 'navigate',
                    url,
                });
            }
        } else if (description.includes('search')) {
            // Extract search queries
            const searchTerms = this.extractSearchQuery(description);

            if (searchTerms) {
                actions.push({
                    type: 'search',
                    query: searchTerms,
                });
            }
        }

        // Look for content extraction requests
        if (description.includes('extract') || description.includes('get') || description.includes('scrape')) {
            actions.push({
                type: 'extract',
                selector: 'body', // Default to extracting the whole page
            });
        }

        // If no specific actions were identified, default to a simple navigation or search
        if (actions.length === 0) {
            // Try to identify a topic to search for
            const searchTerms = this.extractTopic(description);

            if (searchTerms) {
                actions.push({
                    type: 'search',
                    query: searchTerms,
                });
            } else {
                // Default to a screenshot if all else fails
                actions.push({
                    type: 'screenshot',
                });
            }
        }

        return actions;
    }

    /**
     * Extract a search query from a step description
     */
    private extractSearchQuery(description: string): string | null {
        // Look for phrases like "search for X" or "search X"
        const searchRegex = /search\s+(?:for\s+)?["']?([^"']+)["']?/i;
        const match = description.match(searchRegex);

        if (match && match[1]) {
            return match[1].trim();
        }

        return null;
    }

    /**
     * Extract a general topic from a step description
     */
    private extractTopic(description: string): string | null {
        // Extract nouns and noun phrases as potential topics
        // This is a very simplified approach; real NLP would be better

        // Remove common stopwords and other clutter
        const stopwords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'about'];

        // Split into words
        const words = description
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => !stopwords.includes(word.toLowerCase()) && word.length > 2);

        if (words.length > 0) {
            // Use the first 3-5 meaningful words as the topic
            return words.slice(0, Math.min(5, words.length)).join(' ');
        }

        return null;
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