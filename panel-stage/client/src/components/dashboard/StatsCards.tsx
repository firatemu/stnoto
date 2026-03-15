import React from 'react';
import { Paper, Box, Typography, Divider } from '@mui/material';
import {
    Inventory2Outlined,
    PeopleAltOutlined,
    ReceiptOutlined,
    TrendingUpOutlined,
    NorthEast,
} from '@mui/icons-material';

interface StatsProps {
    stats: {
        toplamStok: number;
        cariSayisi: number;
        aylikSatis: number;
        karMarji: number;
    };
    loading: boolean;
}

export default function StatsCards({ stats, loading }: StatsProps) {
    const statsItems = [
        {
            title: 'TOPLAM STOK',
            value: stats.toplamStok,
            icon: Inventory2Outlined,
            color: 'var(--chart-5)',
            formatValue: (val: number) => val.toLocaleString('tr-TR'),
        },
        {
            title: 'AKTİF CARİ',
            value: stats.cariSayisi,
            icon: PeopleAltOutlined,
            color: 'var(--chart-4)',
            formatValue: (val: number) => val.toLocaleString('tr-TR'),
        },
        {
            title: 'AYLIK CİRO',
            value: stats.aylikSatis,
            icon: ReceiptOutlined,
            color: 'var(--chart-3)',
            formatValue: (val: number) => `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        },
        {
            title: 'TAHMİNİ KÂR',
            value: stats.karMarji,
            icon: TrendingUpOutlined,
            color: 'var(--primary)',
            formatValue: (val: number) => `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
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
                        <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'text.primary' }}>
                            {loading ? '...' : item.formatValue(item.value)}
                        </Typography>
                        {index === 2 && !loading && (
                            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(16, 185, 129, 0.1)', px: 0.5, borderRadius: 0.5 }}>
                                <NorthEast sx={{ fontSize: 12, color: '#10b981' }} />
                            </Box>
                        )}
                    </Box>
                </Box>
            ))}
        </Paper>
    );
}
