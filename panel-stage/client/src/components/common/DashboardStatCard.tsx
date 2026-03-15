'use client';

import React from 'react';
import {
    Box,
    Card,
    Typography,
    Stack,
    Skeleton,
} from '@mui/material';
import {
    ArrowUpward,
    ArrowDownward,
} from '@mui/icons-material';

interface DashboardStatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color?: string;
    trend?: {
        value: number;
        label: string;
    };
    loading?: boolean;
    formatValue?: (value: any) => string;
    subtitle?: string;
}

export default function DashboardStatCard({
    title,
    value,
    icon: Icon,
    color = 'var(--primary)',
    trend,
    loading = false,
    formatValue,
    subtitle,
}: DashboardStatCardProps) {
    const displayValue = formatValue ? formatValue(value) : value;

    return (
        <Card
            sx={{
                p: 2.5,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 'var(--shadow-md)',
                    borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)',
                },
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center">
                <Box
                    sx={{
                        bgcolor: `color-mix(in srgb, ${color} 12%, transparent)`,
                        color: color,
                        borderRadius: '12px',
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon sx={{ fontSize: 24 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        sx={{
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            opacity: 0.8,
                            display: 'block',
                            mb: 0.5
                        }}
                    >
                        {title}
                    </Typography>
                    {loading ? (
                        <Skeleton width="60%" height={32} />
                    ) : (
                        <Typography
                            variant="h5"
                            fontWeight={800}
                            sx={{
                                letterSpacing: '-0.02em',
                                color: 'var(--foreground)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {displayValue}
                        </Typography>
                    )}
                    {subtitle && !loading && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={500}
                            sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </Stack>

            {trend && !loading && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 2,
                        pt: 2,
                        borderTop: '1px solid var(--border)',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.25,
                            color: trend.value >= 0 ? '#10b981' : '#ef4444',
                            bgcolor: trend.value >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            px: 1,
                            py: 0.5,
                            borderRadius: '6px'
                        }}
                    >
                        {trend.value >= 0 ? <ArrowUpward sx={{ fontSize: 12 }} /> : <ArrowDownward sx={{ fontSize: 12 }} />}
                        <Typography variant="caption" fontWeight={700}>
                            {Math.abs(trend.value)}%
                        </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        {trend.label}
                    </Typography>
                </Box>
            )}
        </Card>
    );
}
