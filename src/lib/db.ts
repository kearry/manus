/**
 * Database Utilities
 * 
 * Provides utility functions for database operations.
 */

import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Create an agent log entry
 */
export async function createAgentLog(
    taskId: string,
    stepId: string | null,
    level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR',
    message: string,
    agentType: string,
    details?: string
): Promise<void> {
    try {
        await prisma.agentLog.create({
            data: {
                taskId,
                stepId,
                level, // Now a string in SQLite
                message,
                details,
                agentType,
            },
        });
    } catch (error) {
        console.error('Error creating agent log:', error);
    }
}

/**
 * Get logs for a task
 */
export async function getTaskLogs(taskId: string): Promise<any[]> {
    return prisma.agentLog.findMany({
        where: { taskId },
        orderBy: { timestamp: 'asc' },
    });
}

/**
 * Get logs for a task step
 */
export async function getTaskStepLogs(stepId: string): Promise<any[]> {
    return prisma.agentLog.findMany({
        where: { stepId },
        orderBy: { timestamp: 'asc' },
    });
}

/**
 * Create a new task
 */
export async function createTask(
    title: string,
    description: string | null,
    userId: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
): Promise<string> {
    const task = await prisma.task.create({
        data: {
            title,
            description,
            userId,
            priority,
        },
    });

    return task.id;
}

/**
 * Get task by ID
 */
export async function getTaskById(taskId: string): Promise<any | null> {
    return prisma.task.findUnique({
        where: { id: taskId },
        include: {
            steps: {
                orderBy: { stepNumber: 'asc' },
            },
            result: true,
        },
    });
}

/**
 * Get all tasks for a user
 */
export async function getUserTasks(userId: string): Promise<any[]> {
    return prisma.task.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            result: true,
        },
    });
}

/**
 * Update task status
 */
export async function updateTaskStatus(
    taskId: string,
    status: 'PENDING' | 'PLANNING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'FAILED'
): Promise<void> {
    await prisma.task.update({
        where: { id: taskId },
        data: {
            status,
            ...(status === 'RESOLVED' || status === 'CLOSED' ? { completedAt: new Date() } : {}),
        },
    });
}

/**
 * Create task result
 */
export async function createTaskResult(
    taskId: string,
    content: string,
    contentType: string = 'text/plain',
    fileUrls?: string,
    metadata?: Record<string, any>
): Promise<void> {
    await prisma.taskResult.create({
        data: {
            taskId,
            content,
            contentType,
            fileUrls,
            metadata: metadata ? JSON.stringify(metadata) : null,
        },
    });
}

/**
 * Record tool usage
 */
export async function recordToolUsage(
    taskId: string,
    toolName: string,
    command: string
): Promise<string> {
    const toolUsage = await prisma.toolUsage.create({
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
 * Update tool usage with result
 */
export async function updateToolUsage(
    id: string,
    success: boolean,
    output?: string,
    error?: string
): Promise<void> {
    await prisma.toolUsage.update({
        where: { id },
        data: {
            endedAt: new Date(),
            success,
            output,
            error,
        },
    });
}

export default prisma;