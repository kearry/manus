/**
 * Tasks API Routes
 * 
 * Endpoints for task management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import prisma from '../../../lib/db';
import { isAuthenticated, getCurrentUserId } from '../../../lib/auth';

// Schema for creating a task
const createTaskSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

/**
 * GET /api/tasks
 * Get all tasks for the current user
 */
export async function GET(req: NextRequest) {
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

        // Get tasks for the user
        const tasks = await prisma.task.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                result: true,
            },
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(req: NextRequest) {
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

        // Parse and validate request body
        const body = await req.json();
        const validationResult = createTaskSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { title, description, priority } = validationResult.data;

        // Create the task
        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                userId,
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}