/**
 * Base Specialized Agent Interface
 * 
 * Defines the common interface for all specialized agents in the system.
 * Each specialized agent focuses on a specific domain or task type.
 */

import { PrismaClient, TaskStep } from '@prisma/client';
import { createAgentLog } from '../../../lib/db';

export interface AgentExecutionResult {
    success: boolean;
    output: any;
    error?: string;
    metadata?: Record<string, any>;
}

export abstract class BaseSpecializedAgent {
    protected prisma: PrismaClient;
    protected name: string;

    constructor(name: string) {
        this.prisma = new PrismaClient();
        this.name = name;
    }

    /**
     * Execute a task step
     * 
     * Each specialized agent implements this method according to its domain expertise
     */
    public abstract executeStep(step: TaskStep): Promise<AgentExecutionResult>;

    /**
     * Determine if this agent can handle a particular task step
     * 
     * Used for agent selection when the type isn't explicitly specified
     */
    public abstract canHandleStep(step: TaskStep): Promise<boolean>;

    /**
     * Log an informational message
     */
    protected async logInfo(taskId: string, stepId: string, message: string): Promise<void> {
        await createAgentLog(taskId, stepId, 'INFO', message, this.name);
    }

    /**
     * Log an error message
     */
    protected async logError(taskId: string, stepId: string, message: string, details?: any): Promise<void> {
        await createAgentLog(
            taskId,
            stepId,
            'ERROR',
            message,
            this.name,
            details ? JSON.stringify(details) : undefined
        );
    }

    /**
     * Log a debug message
     */
    protected async logDebug(taskId: string, stepId: string, message: string, details?: any): Promise<void> {
        await createAgentLog(
            taskId,
            stepId,
            'DEBUG',
            message,
            this.name,
            details ? JSON.stringify(details) : undefined
        );
    }

    /**
     * Log a warning message
     */
    protected async logWarning(taskId: string, stepId: string, message: string, details?: any): Promise<void> {
        await createAgentLog(
            taskId,
            stepId,
            'WARNING',
            message,
            this.name,
            details ? JSON.stringify(details) : undefined
        );
    }
}