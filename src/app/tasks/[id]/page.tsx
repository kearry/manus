'use client';

import React, { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Play,
    XCircle,
    CheckCircle,
    Terminal,
    Globe,
    FileText,
    Code,
    AlertCircle
} from 'lucide-react';

import { useTask } from '../../../providers/task-provider';
// Remove enum imports
// import { TaskStatus, LogLevel } from '@prisma/client';

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
        PENDING: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending', icon: <Play size={16} /> },
        PLANNING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Planning', icon: <Terminal size={16} /> },
        IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Progress', icon: <Terminal size={16} /> },
        RESOLVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resolved', icon: <CheckCircle size={16} /> },
        CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed', icon: <CheckCircle size={16} /> },
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

const StepStatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
        PENDING: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending' },
        IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Progress' },
        COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
        FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
};

const LogEntry = ({ log }: { log: any }) => {
    const levelConfig = {
        INFO: { text: 'text-blue-600', bg: 'bg-blue-50', icon: <Terminal size={16} /> },
        DEBUG: { text: 'text-gray-600', bg: 'bg-gray-50', icon: <Terminal size={16} /> },
        WARNING: { text: 'text-yellow-600', bg: 'bg-yellow-50', icon: <AlertCircle size={16} /> },
        ERROR: { text: 'text-red-600', bg: 'bg-red-50', icon: <XCircle size={16} /> },
    };

    const config = levelConfig[log.level as keyof typeof levelConfig] || levelConfig.INFO;

    const getToolIcon = (agentType: string) => {
        if (agentType.includes('Web') || agentType.includes('Browser')) {
            return <Globe size={16} />;
        } else if (agentType.includes('Code') || agentType.includes('Execution')) {
            return <Code size={16} />;
        } else if (agentType.includes('Document') || agentType.includes('File')) {
            return <FileText size={16} />;
        } else {
            return <Terminal size={16} />;
        }
    };

    return (
        <div className={`my-1 rounded-md p-2 ${config.bg}`}>
            <div className="flex items-start">
                <div className={`mr-2 mt-0.5 ${config.text}`}>
                    {getToolIcon(log.agentType)}
                </div>
                <div className="flex-1">
                    <div className="flex items-center text-sm">
                        <span className="font-medium">{log.agentType}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{log.message}</p>
                    {log.details && (
                        <pre className="mt-1 overflow-x-auto rounded bg-gray-800 p-2 text-xs text-white">
                            {log.details}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
};

// Task Detail Page
export default function TaskDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { currentTask, loading, error, getTaskById, executeTask, cancelTask, closeTask } = useTask();
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (id) {
            getTaskById(id as string);
        }
    }, [id, getTaskById]);

    // Auto-scroll logs to bottom
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [currentTask?.logs]);

    if (loading && !currentTask) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                        <p>Loading task...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !currentTask) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
                        <p className="text-lg font-medium text-red-600">{error || 'Task not found'}</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => router.push('/dashboard')}
                        >
                            <ArrowLeft className="mr-2" size={16} />
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const isRunning = ['PLANNING', 'IN_PROGRESS'].includes(currentTask.status);
    const isResolved = currentTask.status === 'RESOLVED';
    const isCompleted = currentTask.status === 'CLOSED';
    const isFailed = currentTask.status === 'FAILED';

    return (
        <div className="container mx-auto p-4">
            <div className="mb-4 flex items-center">
                <Button
                    variant="outline"
                    className="mr-4"
                    onClick={() => router.push('/dashboard')}
                >
                    <ArrowLeft className="mr-2" size={16} />
                    Back
                </Button>
                <h1 className="mr-4 text-2xl font-bold">{currentTask.title}</h1>
                <TaskStatusBadge status={currentTask.status} />
            </div>

            {currentTask.description && (
                <p className="mb-6 text-gray-600">{currentTask.description}</p>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Task Steps */}
                <div className="lg:col-span-1">
                    <Card>
                        <h2 className="mb-4 text-lg font-semibold">Task Steps</h2>
                        {currentTask.steps && currentTask.steps.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {currentTask.steps.map((step) => (
                                    <li key={step.id} className="py-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center">
                                                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-800">
                                                        {step.stepNumber}
                                                    </span>
                                                    <p className="font-medium">{step.description}</p>
                                                </div>
                                                {step.startedAt && (
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Started: {new Date(step.startedAt).toLocaleString()}
                                                    </p>
                                                )}
                                                {step.completedAt && (
                                                    <p className="text-xs text-gray-500">
                                                        Completed: {new Date(step.completedAt).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                            <StepStatusBadge status={step.status} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">No steps defined yet</p>
                        )}
                    </Card>

                    {/* Task Controls */}
                    <Card className="mt-4">
                        <h2 className="mb-4 text-lg font-semibold">Task Controls</h2>
                        <div className="flex flex-col gap-2">
                            {isRunning && (
                                <Button
                                    variant="destructive"
                                    onClick={() => cancelTask(currentTask.id)}
                                >
                                    <XCircle className="mr-2" size={16} />
                                    Cancel Task
                                </Button>
                            )}

                            {isResolved && (
                                <Button
                                    variant="primary"
                                    onClick={() => closeTask(currentTask.id)}
                                >
                                    <CheckCircle className="mr-2" size={16} />
                                    Close Task
                                </Button>
                            )}

                            {(isCompleted || isFailed) && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/tasks/${currentTask.id}/result`)}
                                >
                                    <FileText className="mr-2" size={16} />
                                    View Full Result
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Manus's Computer */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <h2 className="mb-4 text-lg font-semibold">Manus's Computer</h2>

                        <div
                            ref={logContainerRef}
                            className="h-[600px] overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-4"
                        >
                            {currentTask.logs && currentTask.logs.length > 0 ? (
                                currentTask.logs.map((log) => (
                                    <LogEntry key={log.id} log={log} />
                                ))
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <p className="text-gray-500">No activity yet</p>
                                </div>
                            )}
                        </div>

                        {isRunning && (
                            <div className="mt-4 flex items-center text-sm text-gray-500">
                                <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                                Manus AI is working on your task...
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Results Section (when available) */}
            {currentTask.result && (
                <Card className="mt-6">
                    <h2 className="mb-4 text-lg font-semibold">Task Result</h2>
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                        <div className="whitespace-pre-wrap">
                            {currentTask.result.content}
                        </div>
                        {currentTask.result.fileUrls && (
                            <div className="mt-4">
                                <h3 className="mb-2 font-medium">Generated Files</h3>
                                <div className="flex flex-wrap gap-2">
                                    {currentTask.result.fileUrls.split(',').map((url: string, index: number) => (
                                        <a
                                            key={index}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center rounded-md bg-indigo-50 px-3 py-1 text-sm text-indigo-700 hover:bg-indigo-100"
                                        >
                                            <FileText className="mr-1" size={14} />
                                            File {index + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}