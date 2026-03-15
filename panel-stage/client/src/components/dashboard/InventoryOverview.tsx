import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from 'recharts';
import { DashboardWidget, ChartContainer } from '@/components/common';

interface InventoryOverviewProps {
    criticalStock: Array<{ id: string; name: string; stock: number; minStock: number; unit: string }>;
    categoryDistribution: Array<{ name: string; value: number; color: string }>;
    loading: boolean;
}

export default function InventoryOverview({ criticalStock, categoryDistribution, loading }: InventoryOverviewProps) {
    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Ürün',
            flex: 1,
            renderCell: (params: any) => (
                <Typography variant="caption" fontWeight={600} sx={{ color: 'var(--foreground)' }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'stock',
            headerName: 'Mevcut',
            width: 70,
            renderCell: (params: any) => (
                <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: params.value <= 0 ? 'var(--destructive)' : 'var(--chart-4)' }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'status',
            headerName: '!',
            width: 50,
            renderCell: (params: any) => (
                <Typography variant="caption" sx={{ color: 'var(--destructive)', fontWeight: 800 }}>KRT</Typography>
            ),
        },
    ];

    const COLORS = ['#0F172A', '#334155', '#64748B', '#94A3B8'];

    return (
        <DashboardWidget
            title="Stok Durumu"
            subtitle="Kritik seviyeler ve kategori dağılımı"
            height={300}
        >
            <Grid container spacing={1}>
                {/* Left: Critical Stock List */}
                <Grid item xs={7}>
                    <Box sx={{ height: 200, width: '100%' }}>
                        {criticalStock.length > 0 ? (
                            <DataGrid
                                rows={criticalStock.slice(0, 5)}
                                columns={columns}
                                getRowId={(row: any) => row.id}
                                hideFooter
                                disableColumnMenu
                                density="compact"
                                sx={{
                                    border: 'none',
                                    '& .MuiDataGrid-cell': { borderBottom: '1px solid var(--border)', px: 0 },
                                    '& .MuiDataGrid-columnHeaders': {
                                        bgcolor: 'transparent',
                                        borderBottom: '1px solid var(--border)',
                                        minHeight: '28px !important',
                                        maxHeight: '28px !important',
                                        fontSize: '0.65rem'
                                    },
                                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
                                    '& .MuiDataGrid-row:hover': { bgcolor: 'transparent' }
                                }}
                            />
                        ) : (
                            <Box sx={{ pt: 4, textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary">Stoklar Güvende</Typography>
                            </Box>
                        )}
                    </Box>
                </Grid>

                {/* Right: Category Distribution Pie */}
                <Grid item xs={5}>
                    <ChartContainer height={200}>
                        <PieChart>
                            <Pie
                                data={categoryDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={50}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {categoryDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    padding: '4px 8px'
                                }}
                            />
                        </PieChart>
                    </ChartContainer>
                </Grid>
            </Grid>
        </DashboardWidget>
    );
}
