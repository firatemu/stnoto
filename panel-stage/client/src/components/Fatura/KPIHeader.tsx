'use client';

import React from 'react';
import { Grid } from '@mui/material';
import { TrendingUp, TrendingDown, HourglassEmpty, Dangerous } from '@mui/icons-material';
import DashboardStatCard from '@/components/common/DashboardStatCard';

interface StatsProps {
    loading: boolean;
    data: {
        aylikSatis: { tutar: number; adet: number };
        tahsilatBekleyen: { tutar: number; adet: number };
        vadesiGecmis: { tutar: number; adet: number };
    } | null;
    type: 'SATIS' | 'ALIS';
}

export default function KPIHeader({ loading, data, type }: StatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const isSatis = type === 'SATIS';

    const cards = [
        {
            id: 'aylik',
            title: isSatis ? 'Bu Ay Satış' : 'Bu Ay Alış',
            value: Number(data?.aylikSatis.tutar || 0),
            subtitle: `${data?.aylikSatis.adet || 0} ${isSatis ? 'fatura' : 'işlem'}`,
            icon: isSatis ? TrendingUp : TrendingDown,
            color: isSatis ? '#10b981' : '#f59e0b',
        },
        {
            id: 'bekleyen',
            title: isSatis ? 'Tahsilat Bekleyen' : 'Ödeme Bekleyen',
            value: Number(data?.tahsilatBekleyen.tutar || 0),
            subtitle: `${data?.tahsilatBekleyen.adet || 0} ${isSatis ? 'fatura' : 'işlem'}`,
            icon: HourglassEmpty,
            color: '#3b82f6',
        },
        {
            id: 'vadesi-gecmis',
            title: 'Vadesi Geçmiş',
            value: Number(data?.vadesiGecmis.tutar || 0),
            subtitle: `${data?.vadesiGecmis.adet || 0} ${isSatis ? 'fatura' : 'işlem'}`,
            icon: Dangerous,
            color: '#ef4444',
        },
    ];

    return (
        <Grid container spacing={3} sx={{ mb: 3 }}>
            {cards.map((card) => (
                <Grid key={card.id} item xs={12} md={4}>
                    <DashboardStatCard
                        title={card.title}
                        value={card.value}
                        subtitle={card.subtitle}
                        icon={card.icon}
                        color={card.color}
                        loading={loading}
                        formatValue={formatCurrency}
                    />
                </Grid>
            ))}
        </Grid>
    );
}
