/**
 * Task Execution API Route
 * 
 * Endpoint for executing a task.
 */

import { NextRequest, NextResponse } from 'next/server';

import prisma from '../../../../../lib/db';
import { isAuthenticated, getCurrentUserId } from '../../../../../lib/auth';
import { ExecutorAgent } from '../../../../../core/agent/executor';

/**
 * POST /api/tasks/[id]/execute
 * Execute a task
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication
        const isAuthed = await isAuthenticated();
        if (!isAuthed) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current user ID
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const taskId = params.id;

        // Check if the task exists and belongs to the user
        const existingTask = await prisma.task.findUnique({
            where: { id: taskId },
        });

        if (!existingTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        if (existingTask.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if the task is in a state that allows execution
        if (existingTask.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Task can only be executed when in PENDING state' },
                { status: 400 }
            );
        }

        // Update the task status to PLANNING
        await prisma.task.update({
            where: { id: taskId },
            data: { status: 'PLANNING' },
        });

        // Create a log entry
        await prisma.agentLog.create({
            data: {
                taskId,
                level: 'INFO',
                message: 'Task execution started',
                agentType: 'API',
            },
        });

        // Start task execution asynchronously
        // This allows the API to respond immediately while the task runs in the background
        const executor = new ExecutorAgent();

        // Use Promise.resolve().then() to make it asynchronous
        // but still handle errors properly
        Promise.resolve().then(async () => {
            try {
                await executor.executeTask(taskId);
            } catch (error) {
                console.error(`Error executing task ${taskId}:`, error);

                // Log the error
                await prisma.agentLog.create({
                    data: {
                        taskId,
                        level: 'ERROR',
                        message: `Task execution failed: ${error instanceof Error ? error.message : String(error)}`,
                        agentType: 'API',
                    },
                });

                // Update task status to FAILED
                await prisma.task.update({
                    where: { id: taskId },
                    data: { status: 'FAILED' },
                });
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Task execution started'
        });
    } catch (error) {
        console.error('Error starting task execution:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}