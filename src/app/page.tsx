'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Terminal, Globe, FileText, Code, User, Server } from 'lucide-react';

export default function LandingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Redirect to dashboard if already authenticated
    React.useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard');
        }
    }, [status, router]);

    return (
        <div className="flex min-h-screen flex-col">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center">
                        <Terminal className="h-8 w-8 text-indigo-600" />
                        <span className="ml-2 text-xl font-bold">Manus AI</span>
                    </div>
                    <div>
                        {status === 'authenticated' ? (
                            <Link
                                href="/dashboard"
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <button
                                onClick={() => signIn('google')}
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-b from-indigo-50 to-white py-24">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900">
                        Meet Your Autonomous AI Assistant
                    </h1>
                    <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
                        Manus AI bridges the gap between human thought and action, executing complex tasks
                        with minimal intervention. Just describe what you need, and Manus handles the rest.
                    </p>
                    <div className="mt-8">
                        <button
                            onClick={() => signIn('google')}
                            className="rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Get Started <ArrowRight className="ml-2 inline h-5 w-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
                        How Manus AI Works
                    </h2>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 inline-flex rounded-full bg-indigo-100 p-3">
                                <Terminal className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold">Autonomous Execution</h3>
                            <p className="text-gray-600">
                                Once a task is assigned, Manus operates asynchronously, continuing to work even when you're not actively engaged.
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 inline-flex rounded-full bg-indigo-100 p-3">
                                <Server className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold">Multi-Agent System</h3>
                            <p className="text-gray-600">
                                Specialized agents collaborate to handle different aspects of your task, from research to data analysis.
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 inline-flex rounded-full bg-indigo-100 p-3">
                                <Globe className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold">Web Integration</h3>
                            <p className="text-gray-600">
                                Manus can browse the web, gather information, and interact with online services to complete your tasks.
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 inline-flex rounded-full bg-indigo-100 p-3">
                                <Code className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold">Code Execution</h3>
                            <p className="text-gray-600">
                                From data analysis to automation scripts, Manus can write and execute code to solve complex problems.
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 inline-flex rounded-full bg-indigo-100 p-3">
                                <FileText className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold">Document Processing</h3>
                            <p className="text-gray-600">
                                Analyze, summarize, and create documents from various sources, including PDFs, spreadsheets, and more.
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 inline-flex rounded-full bg-indigo-100 p-3">
                                <User className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold">Transparent Operation</h3>
                            <p className="text-gray-600">
                                Watch Manus work in real-time through the "Manus's Computer" interface, providing full visibility into its actions.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Use Cases Section */}
            <section className="bg-gray-50 py-16">
                <div className="container mx-auto px-4">
                    <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
                        What Can Manus Do For You?
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-xl font-bold">Research & Analysis</h3>
                            <ul className="list-inside list-disc space-y-2 text-gray-600">
                                <li>Gather information from multiple web sources</li>
                                <li>Analyze data and generate insights</li>
                                <li>Create comprehensive reports</li>
                                <li>Track market trends and compile statistics</li>
                            </ul>
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-xl font-bold">Content Creation</h3>
                            <ul className="list-inside list-disc space-y-2 text-gray-600">
                                <li>Generate articles, blog posts, and marketing copy</li>
                                <li>Create data visualizations</li>
                                <li>Summarize long documents or research papers</li>
                                <li>Produce structured reports and presentations</li>
                            </ul>
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-xl font-bold">Automation</h3>
                            <ul className="list-inside list-disc space-y-2 text-gray-600">
                                <li>Create scripts for repetitive tasks</li>
                                <li>Set up monitoring systems</li>
                                <li>Process and transform data</li>
                                <li>Generate reports on schedules</li>
                            </ul>
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-xl font-bold">Planning & Organization</h3>
                            <ul className="list-inside list-disc space-y-2 text-gray-600">
                                <li>Create project plans and timelines</li>
                                <li>Research and compare options</li>
                                <li>Compile resources and references</li>
                                <li>Organize information into structured formats</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-indigo-600 py-16 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="mb-6 text-3xl font-bold">Ready to Try Manus AI?</h2>
                    <p className="mx-auto mb-8 max-w-2xl text-xl text-indigo-100">
                        Experience the power of an autonomous AI assistant that works for you around the clock.
                    </p>
                    <button
                        onClick={() => signIn('google')}
                        className="rounded-md bg-white px-6 py-3 text-base font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                    >
                        Sign In with Google <ArrowRight className="ml-2 inline h-5 w-5" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white py-8">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-600">
                        &copy; {new Date().getFullYear()} Manus AI. All rights reserved.
                    </p>
                    <div className="mt-4 flex justify-center space-x-6">
                        <a href="#" className="text-gray-500 hover:text-gray-900">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-gray-500 hover:text-gray-900">
                            Terms of Service
                        </a>
                        <a href="#" className="text-gray-500 hover:text-gray-900">
                            Contact
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}