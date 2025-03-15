/**
 * Specialized Agent Registry
 * 
 * A registry of all specialized agents in the system.
 * Used by the executor to select appropriate agents for different tasks.
 */

import { TaskStep } from '@prisma/client';
import { BaseSpecializedAgent } from './base-agent';
import { WebBrowsingAgent } from './web-browsing-agent';
import { DataAnalysisAgent } from './data-analysis-agent';
import { DocumentProcessingAgent } from './document-processing-agent';
import { CodeExecutionAgent } from './code-execution-agent';
import { GeneralPurposeAgent } from './general-purpose-agent';

export class SpecializedAgentRegistry {
    private agents: Map<string, BaseSpecializedAgent>;

    constructor() {
        this.agents = new Map<string, BaseSpecializedAgent>();

        // Register all specialized agents
        this.registerAgent('WebBrowsingAgent', new WebBrowsingAgent());
        this.registerAgent('DataAnalysisAgent', new DataAnalysisAgent());
        this.registerAgent('DocumentProcessingAgent', new DocumentProcessingAgent());
        this.registerAgent('CodeExecutionAgent', new CodeExecutionAgent());
        this.registerAgent('GeneralPurposeAgent', new GeneralPurposeAgent());
    }

    /**
     * Register a specialized agent
     */
    public registerAgent(name: string, agent: BaseSpecializedAgent): void {
        this.agents.set(name, agent);
    }

    /**
     * Get a specialized agent by name
     */
    public getAgent(name: string): BaseSpecializedAgent {
        const agent = this.agents.get(name);

        if (!agent) {
            // If the requested agent doesn't exist, fall back to general purpose
            return this.agents.get('GeneralPurposeAgent')!;
        }

        return agent;
    }

    /**
     * Automatically select the most appropriate agent for a task step
     */
    public async selectAgentForStep(step: TaskStep): Promise<BaseSpecializedAgent> {
        // Try each agent to see if it can handle the step
        for (const [name, agent] of this.agents.entries()) {
            // Skip the general purpose agent initially
            if (name === 'GeneralPurposeAgent') {
                continue;
            }

            if (await agent.canHandleStep(step)) {
                return agent;
            }
        }

        // Fall back to the general purpose agent
        return this.getAgent('GeneralPurposeAgent');
    }

    /**
     * Get all registered agent names
     */
    public getAgentNames(): string[] {
        return Array.from(this.agents.keys());
    }
}

// Export individual agents for direct use
export * from './web-browsing-agent';
export * from './data-analysis-agent';
export * from './document-processing-agent';
export * from './code-execution-agent';
export * from './general-purpose-agent';