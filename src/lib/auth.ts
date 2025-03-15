/**
 * Authentication Configuration
 * 
 * Configures NextAuth for authentication.
 */

// Fix import by using direct path instead
import { PrismaAdapter } from '@auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';

import prisma from './db';

// Define custom types for session data
interface ExtendedSession {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        id?: string; // Add id property
    };
}

export const authOptions: NextAuthOptions = {
    // @ts-ignore - Types are not matching correctly but the adapter works fine
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    callbacks: {
        async session({ session, token }) {
            // Add the id from the token to the session user
            if (token.sub && session.user) {
                (session.user as any).id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
    },
};

/**
 * Get the current server session
 */
export function getServerAuthSession() {
    return getServerSession(authOptions);
}

/**
 * Check if a user is authenticated
 */
export async function isAuthenticated() {
    const session = await getServerAuthSession();
    return !!session?.user;
}

/**
 * Get the current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
    const session = await getServerAuthSession() as ExtendedSession;
    return session?.user?.id || null;
}

/**
 * Require authentication or redirect to login
 */
export async function requireAuth() {
    const isAuthed = await isAuthenticated();

    if (!isAuthed) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }

    return {
        props: {},
    };
}