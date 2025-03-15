/**
 * Task Cancellation API Route
 * 
 * Endpoint for canceling a running task.
 */

import { NextRequest, NextResponse } from 'next/server';

import prisma from '../../../../../lib/db';
import { isAuthenticated, getCurrentUserId } from '../../../../../lib/auth';

/**
 * POST /api/tasks/[id]/cancel
 * Cancel a running task
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

        // Check if the task is in a state that allows cancellation
        const cancellableStates = ['PLANNING', 'IN_PROGRESS'];
        if (!cancellableStates.includes(existingTask.status)) {
            return NextResponse.json(
                { error: 'Task can only be canceled when in PLANNING or IN_PROGRESS state' },
                { status: 400 }
            );
        }

        // Update the task status to FAILED
        await prisma.task.update({
            where: { id: taskId },
            data: { status: 'FAILED' },
        });

        // Create a log entry
        await prisma.agentLog.create({
            data: {
                taskId,
                level: 'INFO',
                message: 'Task was canceled by user',
                agentType: 'API',
            },
        });

        // Mark any in-progress steps as failed
        await prisma.taskStep.updateMany({
            where: {
                taskId,
                status: 'IN_PROGRESS',
            },
            data: {
                status: 'FAILED',
                completedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Task canceled successfully'
        });
    } catch (error) {
        console.error('Error canceling task:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}