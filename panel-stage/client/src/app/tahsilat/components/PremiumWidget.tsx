'use client';

import React from 'react';
import {
    Box,
    Card,
    Typography,
    Stack,
    Divider,
    alpha,
    useTheme,
} from '@mui/material';

interface PremiumWidgetProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    headerAction?: React.ReactNode;
    footer?: React.ReactNode;
    height?: string | number;
}

export default function PremiumWidget({
    title,
    subtitle,
    children,
    headerAction,
    footer,
    height = '100%',
}: PremiumWidgetProps) {
    const theme = useTheme();

    return (
        <Card
            sx={{
                height: height,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '24px',
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.5),
                background: '#ffffff',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.06)',
                },
            }}
        >
            <Box
                sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(to right, #ffffff, #fcfcfc)',
                }}
            >
                <Box>
                    <Typography
                        variant="h6"
                        fontWeight={800}
                        sx={{
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2,
                            color: 'text.primary',
                            fontSize: '1.125rem'
                        }}
                    >
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{
                                mt: 0.5,
                                color: 'text.secondary',
                                opacity: 0.8,
                                fontSize: '0.8125rem'
                            }}
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

            <Divider sx={{ opacity: 0.4 }} />

            <Box
                sx={{
                    flex: 1,
                    p: 3,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {children}
            </Box>

            {footer && (
                <>
                    <Divider sx={{ opacity: 0.4 }} />
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: alpha(theme.palette.action.hover, 0.3),
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        {footer}
                    </Box>
                </>
            )}
        </Card>
    );
}
