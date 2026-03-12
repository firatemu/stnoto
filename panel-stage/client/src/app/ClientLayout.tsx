'use client';

import React from 'react';
import QueryProvider from '@/providers/QueryProvider';
import StorageGuard from '@/providers/StorageGuard';
import InactivityTracker from '@/components/InactivityTracker';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <StorageGuard>
            <QueryProvider>
                <InactivityTracker />
                {children}
            </QueryProvider>
        </StorageGuard>
    );
}
