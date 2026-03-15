'use client';

import React from 'react';
import {
    Box,
    Card,
    Typography,
    Stack,
    Divider,
} from '@mui/material';

interface DashboardWidgetProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    headerAction?: React.ReactNode;
    footer?: React.ReactNode;
    height?: string | number;
}

export default function DashboardWidget({
    title,
    subtitle,
    children,
    headerAction,
    footer,
    height = '100%',
}: DashboardWidgetProps) {
    return (
        <Card
            sx={{
                height: height,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
            }}
        >
            <Box sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.5, opacity: 0.7 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                {headerAction && <Box>{headerAction}</Box>}
            </Box>

            <Divider sx={{ opacity: 0.6 }} />

            <Box sx={{ flex: 1, p: 2.5, position: 'relative' }}>
                {children}
            </Box>

            {footer && (
                <>
                    <Divider sx={{ opacity: 0.6 }} />
                    <Box sx={{ p: 2, bgcolor: 'color-mix(in srgb, var(--muted) 40%, transparent)' }}>
                        {footer}
                    </Box>
                </>
            )}
        </Card>
    );
}
