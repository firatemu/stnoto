import React from 'react';
import { Box } from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';
import { DashboardWidget, ChartContainer } from '@/components/common';

interface CollectionChartProps {
    data: Array<{ name: string; tahsilat: number; odeme: number }>;
    period: 'daily' | 'weekly' | 'monthly';
    loading: boolean;
}

export default function CollectionChart({ data, period, loading }: CollectionChartProps) {
    const periodName = period === 'daily' ? 'Günlük' : period === 'weekly' ? 'Haftalık' : 'Aylık';

    return (
        <DashboardWidget
            title={`${periodName} Akış Analizi`}
            subtitle={period === 'daily' ? 'Saatlik para trafiği' : 'Periyodik giriş ve çıkış dengesi'}
            height={300}
        >
            <ChartContainer height={200}>
                <BarChart
                    data={data}
                    margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                        strokeOpacity={0.6}
                    />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill: 'var(--muted-foreground)',
                            fontSize: 10,
                            fontWeight: 600,
                        }}
                        dy={5}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill: 'var(--muted-foreground)',
                            fontSize: 10,
                            fontWeight: 600,
                        }}
                        tickFormatter={(value: number) => `₺${(value / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                        contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--card)',
                            boxShadow: 'var(--shadow-lg)',
                            padding: '8px',
                        }}
                        itemStyle={{ fontWeight: 700, fontSize: '11px' }}
                        cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                        formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`}
                    />
                    <Legend iconType="circle" iconSize={6} wrapperStyle={{ paddingTop: '10px', fontSize: '10px', fontWeight: 600 }} />
                    <Bar
                        dataKey="tahsilat"
                        name="Tahsilat"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={period === 'daily' ? 10 : 25}
                        animationDuration={1000}
                    />
                    <Bar
                        dataKey="odeme"
                        name="Ödeme"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={period === 'daily' ? 10 : 25}
                        animationDuration={1000}
                    />
                </BarChart>
            </ChartContainer>
        </DashboardWidget>
    );
}
