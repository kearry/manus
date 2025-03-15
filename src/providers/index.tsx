'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { TaskProvider } from './task-provider';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <TaskProvider>{children}</TaskProvider>
        </SessionProvider>
    );
}