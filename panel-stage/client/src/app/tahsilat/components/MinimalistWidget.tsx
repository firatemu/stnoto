'use client';

import React from 'react';
import {
    Box,
    Card,
    Typography,
    Divider,
} from '@mui/material';

interface MinimalistWidgetProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    headerAction?: React.ReactNode;
    footer?: React.ReactNode;
    height?: string | number;
}

export default function MinimalistWidget({
    title,
    subtitle,
    children,
    headerAction,
    footer,
    height = '100%',
}: MinimalistWidgetProps) {
    return (
        <Card
            sx={{
                height: height,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'none',
                overflow: 'hidden',
                bgcolor: 'background.paper',
            }}
        >
            <Box
                sx={{
                    px: 2.5,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box>
                    <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        color="text.primary"
                        sx={{ lineHeight: 1.2 }}
                    >
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: 'block' }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                {headerAction && (
                    <Box sx={{ ml: 2, flexShrink: 0 }}>
                        {headerAction}
                    </Box>
                )}
            </Box>

            <Divider />

            <Box
                sx={{
                    flex: 1,
                    p: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {children}
            </Box>

            {footer && (
                <>
                    <Divider />
                    <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                        {footer}
                    </Box>
                </>
            )}
        </Card>
    );
}
