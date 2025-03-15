/**
 * Task Detail API Routes
 * 
 * Endpoints for managing individual tasks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import prisma from '../../../../lib/db';
import { isAuthenticated, getCurrentUserId } from '../../../../lib/auth';

// Schema for updating a task
const updateTaskSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

/**
 * GET /api/tasks/[id]
 * Get a task by ID
 */
export async function GET(
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

        // Get the task
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                steps: {
                    orderBy: { stepNumber: 'asc' },
                },
                result: true,
            },
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Check if the task belongs to the current user
        if (task.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get logs for the task
        const logs = await prisma.agentLog.findMany({
            where: { taskId },
            orderBy: { timestamp: 'asc' },
        });

        // Include logs in the response
        const taskWithLogs = {
            ...task,
            logs,
        };

        return NextResponse.json(taskWithLogs);
    } catch (error) {
        console.error('Error fetching task:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
 */
export async function PATCH(
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

        // Parse and validate request body
        const body = await req.json();
        const validationResult = updateTaskSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { title, description, priority } = validationResult.data;

        // Update the task
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(priority && { priority }),
            },
            include: {
                steps: {
                    orderBy: { stepNumber: 'asc' },
                },
                result: true,
            },
        });

        return NextResponse.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task
 */
export async function DELETE(
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

        // Check if the task is in a state that allows deletion
        const finalStates = ['CLOSED', 'FAILED'];
        if (!finalStates.includes(existingTask.status)) {
            return NextResponse.json(
                { error: 'Cannot delete a task that is not completed or failed' },
                { status: 400 }
            );
        }

        // Delete the task
        await prisma.task.delete({
            where: { id: taskId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting task:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}