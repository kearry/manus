'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log the error to an error reporting service
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({ errorInfo });
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-red-200 bg-red-50 text-red-700 min-h-[200px]">
                    <AlertCircle className="w-12 h-12 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
                    <p className="text-center mb-4">
                        There was an error rendering this component
                    </p>
                    {this.state.error && (
                        <div className="p-4 bg-white rounded shadow-sm w-full max-w-lg overflow-auto">
                            <p className="font-semibold mb-2">Error:</p>
                            <p className="font-mono text-sm">{this.state.error.toString()}</p>
                        </div>
                    )}
                    <button
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;