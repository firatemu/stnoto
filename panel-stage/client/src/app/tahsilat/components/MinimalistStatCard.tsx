'use client';

import React from 'react';
import {
    Box,
    Card,
    Typography,
    Stack,
    Skeleton,
    alpha,
} from '@mui/material';

interface MinimalistStatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color?: string;
    loading?: boolean;
    formatValue?: (value: any) => string;
    subtitle?: string;
}

export default function MinimalistStatCard({
    title,
    value,
    icon: Icon,
    color = '#3b82f6',
    loading = false,
    formatValue,
    subtitle,
}: MinimalistStatCardProps) {
    const displayValue = formatValue ? formatValue(value) : value;

    return (
        <Card
            sx={{
                p: 2.5,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'none',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: color,
                    bgcolor: alpha(color, 0.02),
                }
            }}
        >
            <Box
                sx={{
                    bgcolor: alpha(color, 0.1),
                    color: color,
                    borderRadius: '10px',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <Icon sx={{ fontSize: 24 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="caption"
                    fontWeight={600}
                    color="text.secondary"
                    sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        mb: 0.25
                    }}
                >
                    {title}
                </Typography>
                {loading ? (
                    <Skeleton width="60%" height={32} />
                ) : (
                    <Typography
                        variant="h5"
                        fontWeight={700}
                        sx={{
                            color: 'text.primary',
                            lineHeight: 1.2
                        }}
                    >
                        {displayValue}
                    </Typography>
                )}
                {subtitle && !loading && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.25 }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Card>
    );
}
