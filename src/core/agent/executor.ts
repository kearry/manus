/**
 * Executor Agent
 * 
 * The core orchestrator of the Manus AI system. Coordinates task execution
 * by analyzing the current state, selecting appropriate actions, and delegating
 * to specialized agents as needed.
 */

import { PrismaClient, Task, TaskStep } from '@prisma/client';
import { Planner } from './planner';
import { ToolRegistry } from '../tools';
import { SpecializedAgentRegistry } from './specialized';
import { createAgentLog } from '../../lib/db';

export class ExecutorAgent {
    private prisma: PrismaClient;
    private planner: Planner;
    private toolRegistry: ToolRegistry;
    private specializedAgents: SpecializedAgentRegistry;

    constructor() {
        this.prisma = new PrismaClient();
        this.planner = new Planner();
        this.toolRegistry = new ToolRegistry();
        this.specializedAgents = new SpecializedAgentRegistry();
    }

    /**
     * Initialize task execution
     */
    public async executeTask(taskId: string): Promise<void> {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
        });

        if (!task) {
            throw new Error(`Task with ID ${taskId} not found`);
        }

        try {
            // Update task status to PLANNING
            await this.updateTaskStatus(taskId, 'PLANNING');
            await this.logInfo(taskId, null, 'Task execution started');

            // Generate execution plan
            const plan = await this.planner.createPlan(task);

            // Save plan steps to database
            await this.storePlanSteps(taskId, plan);

            // Update task status to IN_PROGRESS
            await this.updateTaskStatus(taskId, 'IN_PROGRESS');

            // Execute plan steps sequentially
            await this.executeTaskSteps(taskId);

            // Mark task as resolved when all steps are complete
            await this.updateTaskStatus(taskId, 'RESOLVED');
            await this.logInfo(taskId, null, 'Task execution completed successfully');
        } catch (error) {
            // Handle errors
            await this.handleExecutionError(taskId, error);
        }
    }

    /**
     * Execute all steps of a task in sequence
     */
    private async executeTaskSteps(taskId: string): Promise<void> {
        const steps = await this.prisma.taskStep.findMany({
            where: { taskId },
            orderBy: { stepNumber: 'asc' },
        });

        for (const step of steps) {
            await this.executeTaskStep(step);

            // Check if task has been canceled or failed
            const task = await this.prisma.task.findUnique({
                where: { id: taskId },
            });

            if (task?.status === 'FAILED') {
                break;
            }
        }
    }

    /**
     * Execute a single task step
     */
    private async executeTaskStep(step: TaskStep): Promise<void> {
        await this.logInfo(step.taskId, step.id, `Starting execution of step ${step.stepNumber}: ${step.description}`);

        try {
            // Update step status
            await this.prisma.taskStep.update({
                where: { id: step.id },
                data: {
                    status: 'IN_PROGRESS',
                    startedAt: new Date(),
                },
            });

            // Analyze the step to determine which specialized agent to use
            const agentType = await this.analyzeStepForAgentSelection(step);
            const agent = this.specializedAgents.getAgent(agentType);

            // Execute the step with the appropriate agent
            const result = await agent.executeStep(step);

            // Update step as completed
            await this.prisma.taskStep.update({
                where: { id: step.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            });

            await this.logInfo(step.taskId, step.id, `Completed step ${step.stepNumber}: ${step.description}`);

            // Return value is not used
        } catch (error) {
            // Handle step execution error
            await this.handleStepExecutionError(step, error);
            throw error;
        }
    }

    /**
     * Determine which specialized agent should handle a particular step
     */
    private async analyzeStepForAgentSelection(step: TaskStep): Promise<string> {
        // This would involve NLP and pattern matching to determine the appropriate agent
        // For now, we'll use a simple approach based on keywords in the description
        const description = step.description.toLowerCase();

        if (description.includes('data') || description.includes('analyze')) {
            return 'DataAnalysisAgent';
        } else if (description.includes('web') || description.includes('browse') || description.includes('search')) {
            return 'WebBrowsingAgent';
        } else if (description.includes('file') || description.includes('document')) {
            return 'DocumentProcessingAgent';
        } else if (description.includes('code') || description.includes('program')) {
            return 'CodeExecutionAgent';
        } else {
            return 'GeneralPurposeAgent';
        }
    }

    /**
     * Store the execution plan steps in the database
     */
    private async storePlanSteps(taskId: string, planSteps: { description: string }[]): Promise<void> {
        // Clear any existing steps for this task
        await this.prisma.taskStep.deleteMany({
            where: { taskId },
        });

        // Create new steps
        for (let i = 0; i < planSteps.length; i++) {
            await this.prisma.taskStep.create({
                data: {
                    taskId,
                    stepNumber: i + 1,
                    description: planSteps[i].description,
                    status: 'PENDING',
                },
            });
        }

        await this.logInfo(taskId, null, `Created execution plan with ${planSteps.length} steps`);
    }

    /**
     * Update the status of a task
     */
    private async updateTaskStatus(taskId: string, status: string): Promise<void> {
        await this.prisma.task.update({
            where: { id: taskId },
            data: { status },
        });

        await this.logInfo(taskId, null, `Task status updated to ${status}`);
    }

    /**
     * Handle errors during task execution
     */
    private async handleExecutionError(taskId: string, error: any): Promise<void> {
        const errorMessage = error instanceof Error ? error.message : String(error);

        await this.logError(taskId, null, `Task execution failed: ${errorMessage}`);

        await this.updateTaskStatus(taskId, 'FAILED');
    }

    /**
     * Handle errors during step execution
     */
    private async handleStepExecutionError(step: TaskStep, error: any): Promise<void> {
        const errorMessage = error instanceof Error ? error.message : String(error);

        await this.logError(step.taskId, step.id, `Step execution failed: ${errorMessage}`);

        await this.prisma.taskStep.update({
            where: { id: step.id },
            data: {
                status: 'FAILED',
                completedAt: new Date(),
            },
        });
    }

    /**
     * Log an informational message
     */
    private async logInfo(taskId: string, stepId: string | null, message: string): Promise<void> {
        await createAgentLog(taskId, stepId, 'INFO', message, 'ExecutorAgent');
    }

    /**
     * Log an error message
     */
    private async logError(taskId: string, stepId: string | null, message: string): Promise<void> {
        await createAgentLog(taskId, stepId, 'ERROR', message, 'ExecutorAgent');
    }
}