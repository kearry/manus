'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, Check, XCircle, Clock, AlertCircle } from 'lucide-react';

import { useTask } from '../../providers/task-provider';

// UI Components (would be in separate files in a real implementation)
const Button = ({
    children,
    onClick,
    variant = 'primary',
    className = '',
    disabled = false
}: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    className?: string;
    disabled?: boolean;
}) => {
    const baseClasses = 'flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variantClasses = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
        outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={onClick}
            disabled={disabled}
            type="button"
        >
            {children}
        </button>
    );
};

const Card = ({
    children,
    className = ''
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
        {children}
    </div>
);

const TaskStatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
        PENDING: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending', icon: <Clock size={16} /> },
        PLANNING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Planning', icon: <Clock size={16} /> },
        IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Progress', icon: <Clock size={16} /> },
        RESOLVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resolved', icon: <Check size={16} /> },
        CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed', icon: <Check size={16} /> },
        FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed', icon: <XCircle size={16} /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
            {config.icon}
            {config.label}
        </span>
    );
};

// Modal component for creating new tasks
const CreateTaskModal = ({
    isOpen,
    onClose,
    onSubmit
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, description: string) => Promise<void>;
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onSubmit(title, description);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6">
                <h2 className="mb-4 text-xl font-bold">Create New Task</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            rows={4}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <button
                            type="submit"
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Dashboard Page
export default function DashboardPage() {
    const { tasks, loading, error, createTask, executeTask } = useTask();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateTask = async (title: string, description: string) => {
        const taskId = await createTask(title, description);
        if (taskId) {
            // Start execution automatically
            await executeTask(taskId);
        }
    };

    // Group tasks by status
    const groupedTasks = {
        active: tasks.filter(task =>
            ['PLANNING', 'IN_PROGRESS'].includes(task.status)
        ),
        pending: tasks.filter(task =>
            task.status === 'PENDING'
        ),
        completed: tasks.filter(task =>
            ['RESOLVED', 'CLOSED'].includes(task.status)
        ),
        failed: tasks.filter(task =>
            task.status === 'FAILED'
        ),
    };

    return (
        <div className="container mx-auto p-4">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Manus AI Dashboard</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2" size={16} />
                    New Task
                </Button>
            </div>

            {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
                    <div className="flex items-center">
                        <AlertCircle className="mr-2" size={16} />
                        <span>Error: {error}</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Active Tasks */}
                <Card>
                    <h2 className="mb-4 text-lg font-semibold">Active Tasks</h2>
                    {loading ? (
                        <p className="text-gray-500">Loading...</p>
                    ) : groupedTasks.active.length === 0 ? (
                        <p className="text-gray-500">No active tasks</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {groupedTasks.active.map((task) => (
                                <li key={task.id} className="py-3">
                                    <Link href={`/tasks/${task.id}`} className="block hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium">{task.title}</h3>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Created {new Date(task.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center">
                                                <TaskStatusBadge status={task.status} />
                                                <ChevronRight className="ml-2" size={16} />
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                {/* Pending Tasks */}
                <Card>
                    <h2 className="mb-4 text-lg font-semibold">Pending Tasks</h2>
                    {loading ? (
                        <p className="text-gray-500">Loading...</p>
                    ) : groupedTasks.pending.length === 0 ? (
                        <p className="text-gray-500">No pending tasks</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {groupedTasks.pending.map((task) => (
                                <li key={task.id} className="py-3">
                                    <Link href={`/tasks/${task.id}`} className="block hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium">{task.title}</h3>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Created {new Date(task.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center">
                                                {/* Fixed the event handler issue by creating a wrapper function */}
                                                <Button
                                                    variant="outline"
                                                    className="mr-2 py-1"
                                                    onClick={() => {
                                                        // Use a wrapper function that doesn't need the event parameter
                                                        executeTask(task.id);
                                                    }}
                                                >
                                                    Start
                                                </Button>
                                                <TaskStatusBadge status={task.status} />
                                                <ChevronRight className="ml-2" size={16} />
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                {/* Completed Tasks */}
                <Card>
                    <h2 className="mb-4 text-lg font-semibold">Completed Tasks</h2>
                    {loading ? (
                        <p className="text-gray-500">Loading...</p>
                    ) : groupedTasks.completed.length === 0 ? (
                        <p className="text-gray-500">No completed tasks</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {groupedTasks.completed.map((task) => (
                                <li key={task.id} className="py-3">
                                    <Link href={`/tasks/${task.id}`} className="block hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium">{task.title}</h3>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Completed {task.completedAt ? new Date(task.completedAt).toLocaleString() : 'Unknown'}
                                                </p>
                                            </div>
                                            <div className="flex items-center">
                                                <TaskStatusBadge status={task.status} />
                                                <ChevronRight className="ml-2" size={16} />
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                {/* Failed Tasks */}
                <Card>
                    <h2 className="mb-4 text-lg font-semibold">Failed Tasks</h2>
                    {loading ? (
                        <p className="text-gray-500">Loading...</p>
                    ) : groupedTasks.failed.length === 0 ? (
                        <p className="text-gray-500">No failed tasks</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {groupedTasks.failed.map((task) => (
                                <li key={task.id} className="py-3">
                                    <Link href={`/tasks/${task.id}`} className="block hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium">{task.title}</h3>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Failed {new Date(task.updatedAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center">
                                                <TaskStatusBadge status={task.status} />
                                                <ChevronRight className="ml-2" size={16} />
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateTask}
            />
        </div>
    );
}