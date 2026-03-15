import React from 'react';
import { Paper, Box, Typography, Chip } from '@mui/material';
import {
    TrendingUpOutlined,
    TrendingDownOutlined,
    AccountBalanceWalletOutlined,
    ShowChartOutlined,
} from '@mui/icons-material';

interface CollectionStatsProps {
    data: {
        currentMonthCollection: number;
        currentMonthPayment: number;
        previousMonthCollection: number;
        previousMonthPayment: number;
    };
    period: 'daily' | 'weekly' | 'monthly';
    loading: boolean;
}

export default function CollectionStats({ data, period, loading }: CollectionStatsProps) {
    const netBalance = data.currentMonthCollection - data.currentMonthPayment;

    const collectionGrowth = data.previousMonthCollection > 0
        ? ((data.currentMonthCollection - data.previousMonthCollection) / data.previousMonthCollection) * 100
        : 0;

    const paymentGrowth = data.previousMonthPayment > 0
        ? ((data.currentMonthPayment - data.previousMonthPayment) / data.previousMonthPayment) * 100
        : 0;

    const periodLabel = period === 'daily' ? 'Güne' : period === 'weekly' ? 'Haftaya' : 'Aya';

    const statsItems = [
        {
            title: `${period === 'daily' ? 'GÜNLÜK' : period === 'weekly' ? 'HAFTALIK' : 'AYLIK'} TAHSİLAT`,
            value: data.currentMonthCollection,
            icon: TrendingUpOutlined,
            color: '#10b981',
            trend: collectionGrowth,
            formatValue: (val: number) => `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        },
        {
            title: `${period === 'daily' ? 'GÜNLÜK' : period === 'weekly' ? 'HAFTALIK' : 'AYLIK'} ÖDEME`,
            value: data.currentMonthPayment,
            icon: TrendingDownOutlined,
            color: '#ef4444',
            trend: paymentGrowth,
            formatValue: (val: number) => `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        },
        {
            title: `NET AKIŞ`,
            value: netBalance,
            icon: AccountBalanceWalletOutlined,
            color: netBalance >= 0 ? 'var(--primary)' : '#f59e0b',
            formatValue: (val: number) => `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        },
        {
            title: 'TAHSİLAT ORANI',
            value: (data.currentMonthCollection / (data.currentMonthCollection + data.currentMonthPayment || 1)) * 100,
            icon: ShowChartOutlined,
            color: '#8b5cf6',
            formatValue: (val: number) => `%${val.toFixed(1)}`,
        },
    ];

    return (
        <Paper
            variant="outlined"
            sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
                borderRadius: 2,
                overflow: 'hidden',
                borderColor: 'var(--border)',
                bgcolor: 'var(--card)'
            }}
        >
            {statsItems.map((item, index) => (
                <Box
                    key={index}
                    sx={{
                        flex: '1 1 120px',
                        p: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        borderRight: index < statsItems.length - 1 ? '1px solid var(--border)' : 'none',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.01)' }
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            fontSize: '0.7rem',
                            color: 'text.secondary',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            mb: 0.5,
                            letterSpacing: '0.02em'
                        }}
                    >
                        {item.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 700, color: item.color === '#ef4444' ? '#ef4444' : 'text.primary' }}>
                            {loading ? '...' : item.formatValue(item.value)}
                        </Typography>
                        {item.trend !== undefined && item.trend !== 0 && !loading && (
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color: item.trend >= 0 ? '#10b981' : '#ef4444'
                                }}
                            >
                                {item.trend >= 0 ? '↑' : '↓'}
                            </Typography>
                        )}
                    </Box>
                </Box>
            ))}
        </Paper>
    );
}
