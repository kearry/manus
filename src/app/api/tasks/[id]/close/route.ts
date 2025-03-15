/**
 * Task Closure API Route
 * 
 * Endpoint for closing a resolved task.
 */

import { NextRequest, NextResponse } from 'next/server';

import prisma from '../../../../../lib/db';
import { isAuthenticated, getCurrentUserId } from '../../../../../lib/auth';

/**
 * POST /api/tasks/[id]/close
 * Close a resolved task
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

        // Check if the task is in RESOLVED state
        if (existingTask.status !== 'RESOLVED') {
            return NextResponse.json(
                { error: 'Task can only be closed when in RESOLVED state' },
                { status: 400 }
            );
        }

        // Update the task status to CLOSED
        await prisma.task.update({
            where: { id: taskId },
            data: {
                status: 'CLOSED',
                completedAt: new Date(),
            },
        });

        // Create a log entry
        await prisma.agentLog.create({
            data: {
                taskId,
                level: 'INFO',
                message: 'Task was closed by user',
                agentType: 'API',
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Task closed successfully'
        });
    } catch (error) {
        console.error('Error closing task:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}