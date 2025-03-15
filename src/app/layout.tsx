import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from '../providers';
import React from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Manus AI - Autonomous Agent',
    description: 'An autonomous AI agent that executes complex tasks with minimal human intervention',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}