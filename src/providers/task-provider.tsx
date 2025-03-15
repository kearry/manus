'use client';

/**
 * Task Provider
 * 
 * Provides task state management and actions for the UI.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Changed from importing TaskStatus
import { Task, TaskStep } from '@prisma/client';

interface TaskWithDetails extends Task {
    steps?: TaskStep[];
    logs?: any[];
    result?: any;
}

interface TaskContextType {
    tasks: TaskWithDetails[];
    currentTask: TaskWithDetails | null;
    loading: boolean;
    error: string | null;
    refreshTasks: () => Promise<void>;
    createTask: (title: string, description: string) => Promise<string>;
    getTaskById: (taskId: string) => Promise<void>;
    executeTask: (taskId: string) => Promise<void>;
    cancelTask: (taskId: string) => Promise<void>;
    closeTask: (taskId: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType>({
    tasks: [],
    currentTask: null,
    loading: false,
    error: null,
    refreshTasks: async () => { },
    createTask: async () => '',
    getTaskById: async () => { },
    executeTask: async () => { },
    cancelTask: async () => { },
    closeTask: async () => { },
});

export function useTask() {
    return useContext(TaskContext);
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
    const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
    const [currentTask, setCurrentTask] = useState<TaskWithDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    // Load tasks on initial mount
    useEffect(() => {
        refreshTasks();
    }, []);

    // Load task details when current task changes
    useEffect(() => {
        if (currentTask?.id) {
            const intervalId = setInterval(() => {
                getTaskById(currentTask.id);
            }, 5000); // Refresh every 5 seconds

            return () => clearInterval(intervalId);
        }
    }, [currentTask?.id]);

    /**
     * Refresh the list of tasks
     */
    const refreshTasks = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/tasks');

            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }

            const data = await response.json();
            setTasks(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Create a new task
     */
    const createTask = async (title: string, description: string): Promise<string> => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    description,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create task');
            }

            const data = await response.json();

            // Refresh the task list
            await refreshTasks();

            return data.id;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return '';
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get task details by ID
     */
    const getTaskById = async (taskId: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/tasks/${taskId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch task');
            }

            const data = await response.json();
            setCurrentTask(data);

            // Also update the task in the tasks list
            setTasks(prev =>
                prev.map(task => (task.id === taskId ? data : task))
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Execute a task
     */
    const executeTask = async (taskId: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/tasks/${taskId}/execute`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to execute task');
            }

            // Get the updated task
            await getTaskById(taskId);

            // Navigate to the task page
            router.push(`/tasks/${taskId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Cancel a running task
     */
    const cancelTask = async (taskId: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/tasks/${taskId}/cancel`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to cancel task');
            }

            // Get the updated task
            await getTaskById(taskId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Close a resolved task
     */
    const closeTask = async (taskId: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/tasks/${taskId}/close`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to close task');
            }

            // Get the updated task
            await getTaskById(taskId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const value = {
        tasks,
        currentTask,
        loading,
        error,
        refreshTasks,
        createTask,
        getTaskById,
        executeTask,
        cancelTask,
        closeTask,
    };

    return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}