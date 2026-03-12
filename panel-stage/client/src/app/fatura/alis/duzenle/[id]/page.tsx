'use client';

import React, { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlisFaturaForm } from '../../yeni/page';
import { Box, CircularProgress } from '@mui/material';

export default function AlisFaturaDuzenlePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    return (
        <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        }>
            <AlisFaturaForm
                faturaId={id}
                onBack={() => router.push('/fatura/alis')}
            />
        </Suspense>
    );
}
