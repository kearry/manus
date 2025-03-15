/**
 * Planner Agent
 * 
 * The Planner is responsible for breaking down complex tasks into 
 * a sequence of executable steps. It analyzes the user's request
 * and creates a structured roadmap for execution.
 */

import { Task } from '@prisma/client';
import { getLLMResponse } from '../../lib/ai';

export interface PlanStep {
    description: string;
    estimatedTimeSeconds?: number;
    requiredTools?: string[];
}

export class Planner {
    /**
     * Create an execution plan for a task
     * 
     * @param task The task to create a plan for
     * @returns An array of plan steps
     */
    public async createPlan(task: Task): Promise<PlanStep[]> {
        // Construct the prompt for the language model
        const prompt = this.constructPlanningPrompt(task);

        // Get plan from language model
        const planText = await getLLMResponse(prompt);

        // Parse the response into a structured plan
        const planSteps = this.parsePlanFromLLMResponse(planText);

        return planSteps;
    }

    /**
     * Construct a prompt for the language model to create a plan
     */
    private constructPlanningPrompt(task: Task): string {
        return `
Task Planning Request:

I need to break down the following task into a detailed step-by-step plan:

Task Title: ${task.title}
Task Description: ${task.description || 'No additional description provided'}

Please create a step-by-step plan to accomplish this task. Each step should be clear, 
actionable, and specific. The plan should cover all necessary stages from initial 
data gathering to final output/completion.

For each step, provide:
1. A clear description of what needs to be done
2. Any tools or resources that might be needed for that step
3. An estimate of the time required (if possible)

Format the response as a numbered list of steps.
`;
    }

    /**
     * Parse the language model response into a structured plan
     */
    private parsePlanFromLLMResponse(response: string): PlanStep[] {
        // This is a simplified implementation
        // In a production system, you would want more robust parsing

        // Split the response by lines and look for numbered steps
        const lines = response.split('\n');
        const planSteps: PlanStep[] = [];

        // Simple regex to match numbered steps like "1. Step description"
        const stepRegex = /^\s*(\d+)[.)\]]\s+(.+)$/;

        let currentStep: PlanStep | null = null;

        for (const line of lines) {
            const match = line.match(stepRegex);

            if (match) {
                // If we found a new step and already have a current step, push it to the array
                if (currentStep) {
                    planSteps.push(currentStep);
                }

                // Create a new step
                currentStep = {
                    description: match[2].trim(),
                };
            } else if (currentStep && line.trim()) {
                // If this line isn't a new step and we have a current step,
                // append this line to the current step's description
                currentStep.description += ' ' + line.trim();

                // Check for time estimates
                if (line.toLowerCase().includes('time') || line.toLowerCase().includes('duration')) {
                    const timeRegex = /(\d+)\s*(min|hour|sec|minute|second|hr)/i;
                    const timeMatch = line.match(timeRegex);

                    if (timeMatch) {
                        const value = parseInt(timeMatch[1]);
                        const unit = timeMatch[2].toLowerCase();

                        // Convert to seconds
                        let seconds = value;
                        if (unit.startsWith('min')) {
                            seconds = value * 60;
                        } else if (unit.startsWith('hour') || unit === 'hr') {
                            seconds = value * 3600;
                        }

                        currentStep.estimatedTimeSeconds = seconds;
                    }
                }

                // Look for tools
                if (line.toLowerCase().includes('tool') || line.toLowerCase().includes('resource')) {
                    const toolsList: string[] = [];

                    // Look for common tools in the line
                    const toolsToCheck = [
                        'browser', 'web', 'search', 'terminal', 'shell', 'file', 'python',
                        'code', 'database', 'sql', 'api', 'document'
                    ];

                    for (const tool of toolsToCheck) {
                        if (line.toLowerCase().includes(tool)) {
                            toolsList.push(tool);
                        }
                    }

                    if (toolsList.length > 0) {
                        currentStep.requiredTools = toolsList;
                    }
                }
            }
        }

        // Add the last step if one exists
        if (currentStep) {
            planSteps.push(currentStep);
        }

        return planSteps;
    }

    /**
     * Update a plan based on intermediate results
     * 
     * This allows the system to adapt its approach based on
     * what it discovers during execution
     */
    public async updatePlan(
        task: Task,
        currentPlan: PlanStep[],
        completedStepIndices: number[],
        intermediateResults: any[]
    ): Promise<PlanStep[]> {
        // Create a prompt that includes the original task, current plan,
        // which steps have been completed, and the results so far
        const prompt = this.constructPlanUpdatePrompt(
            task,
            currentPlan,
            completedStepIndices,
            intermediateResults
        );

        // Get updated plan from language model
        const updatedPlanText = await getLLMResponse(prompt);

        // Parse the response
        const updatedPlanSteps = this.parsePlanFromLLMResponse(updatedPlanText);

        return updatedPlanSteps;
    }

    /**
     * Construct a prompt for updating an existing plan
     */
    private constructPlanUpdatePrompt(
        task: Task,
        currentPlan: PlanStep[],
        completedStepIndices: number[],
        intermediateResults: any[]
    ): string {
        // Format the current plan steps
        const planStepsText = currentPlan
            .map((step, index) => {
                const status = completedStepIndices.includes(index) ? '[COMPLETED]' : '[PENDING]';
                return `${index + 1}. ${status} ${step.description}`;
            })
            .join('\n');

        // Format the intermediate results
        const resultsText = intermediateResults
            .map((result, index) => `Result ${index + 1}: ${JSON.stringify(result)}`)
            .join('\n');

        return `
Task Plan Update Request:

I am working on the following task:

Task Title: ${task.title}
Task Description: ${task.description || 'No additional description provided'}

Current plan:
${planStepsText}

Completed steps: ${completedStepIndices.map(i => i + 1).join(', ')}

Intermediate results:
${resultsText}

Based on these intermediate results, please provide an updated plan for the remaining steps.
The updated plan should adapt to what we've learned from the completed steps and their results.

Format the response as a numbered list of steps, starting from step ${Math.max(...completedStepIndices, 0) + 1
            }.
`;
    }
}