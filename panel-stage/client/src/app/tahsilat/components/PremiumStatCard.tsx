'use client';

import React from 'react';
import {
    Box,
    Card,
    Typography,
    Stack,
    Skeleton,
    alpha,
    useTheme,
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
} from '@mui/icons-material';

interface PremiumStatCardProps {
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

export default function PremiumStatCard({
    title,
    value,
    icon: Icon,
    color = '#3b82f6',
    trend,
    loading = false,
    formatValue,
    subtitle,
}: PremiumStatCardProps) {
    const theme = useTheme();
    const displayValue = formatValue ? formatValue(value) : value;

    return (
        <Card
            sx={{
                p: 3,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '24px',
                border: '1px solid',
                borderColor: alpha(color, 0.1),
                background: `linear-gradient(135deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#ffffff', 0.7)} 100%)`,
                backdropFilter: 'blur(20px)',
                boxShadow: `0 8px 32px ${alpha(color, 0.08)}, 0 1px 2px ${alpha(color, 0.05)}`,
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: `0 20px 40px ${alpha(color, 0.15)}, 0 1px 2px ${alpha(color, 0.1)}`,
                    borderColor: alpha(color, 0.3),
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(color, 0.15)} 0%, transparent 70%)`,
                    zIndex: 0,
                },
            }}
        >
            <Stack direction="row" spacing={2.5} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                <Box
                    sx={{
                        background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
                        color: '#fff',
                        borderRadius: '18px',
                        width: 56,
                        height: 56,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 8px 20px ${alpha(color, 0.3)}`,
                        flexShrink: 0,
                        transition: 'transform 0.3s ease',
                        '.MuiCard-root:hover &': {
                            transform: 'rotate(-10deg) scale(1.1)',
                        }
                    }}
                >
                    <Icon sx={{ fontSize: 28 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{
                            color: 'text.secondary',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            display: 'block',
                            mb: 0.5,
                            fontSize: '0.65rem',
                            opacity: 0.8
                        }}
                    >
                        {title}
                    </Typography>
                    {loading ? (
                        <Skeleton width="80%" height={40} />
                    ) : (
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            sx={{
                                letterSpacing: '-0.02em',
                                color: 'text.primary',
                                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {displayValue}
                        </Typography>
                    )}
                    {subtitle && !loading && (
                        <Typography
                            variant="caption"
                            fontWeight={600}
                            sx={{
                                display: 'block',
                                mt: 0.5,
                                color: alpha(theme.palette.text.secondary, 0.7),
                                fontSize: '0.75rem'
                            }}
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
                        gap: 1,
                        mt: 2.5,
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: alpha(theme.palette.divider, 0.5),
                        position: 'relative',
                        zIndex: 1
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: trend.value >= 0 ? '#10b981' : '#ef4444',
                            bgcolor: trend.value >= 0 ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                            px: 1.2,
                            py: 0.4,
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: trend.value >= 0 ? alpha('#10b981', 0.2) : alpha('#ef4444', 0.2),
                        }}
                    >
                        {trend.value >= 0 ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
                        <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.75rem' }}>
                            {Math.abs(trend.value)}%
                        </Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {trend.label}
                    </Typography>
                </Box>
            )}
        </Card>
    );
}
