import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Button } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { ArrowForward, DescriptionOutlined, PaymentOutlined } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardWidget from '../common/DashboardWidget';

interface RecentTransactionsProps {
    invoices: Array<any>;
    payments: Array<any>;
    loading: boolean;
}

export default function RecentTransactions({ invoices, payments, loading }: RecentTransactionsProps) {
    const [tabValue, setTabValue] = useState(0);
    const router = useRouter();

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const invoiceColumns: GridColDef[] = [
        {
            field: 'unvan',
            headerName: 'Cari Ünvan',
            flex: 1,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionOutlined sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{params.value}</Typography>
                </Box>
            ),
        },
        {
            field: 'tarih',
            headerName: 'Tarih',
            width: 90,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-'}
                </Typography>
            ),
        },
        {
            field: 'tutar',
            headerName: 'Tutar',
            width: 110,
            renderCell: (params) => (
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    ₺{Number(params.value).toLocaleString('tr-TR')}
                </Typography>
            ),
        },
    ];

    const paymentColumns: GridColDef[] = [
        {
            field: 'cariAdi',
            headerName: 'Cari / Banka',
            flex: 1,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentOutlined sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{params.value || 'Kasa Hareketi'}</Typography>
                </Box>
            ),
        },
        {
            field: 'tarih',
            headerName: 'Tarih',
            width: 90,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-'}
                </Typography>
            ),
        },
        {
            field: 'tutar',
            headerName: 'Tutar',
            width: 110,
            renderCell: (params) => (
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: 700,
                        color: params.row.tur === 'GIRIS' ? '#10b981' : '#ef4444'
                    }}
                >
                    {params.row.tur === 'GIRIS' ? '+' : '-'}₺{Number(params.value).toLocaleString('tr-TR')}
                </Typography>
            ),
        },
    ];

    return (
        <DashboardWidget
            title="Son Hareketler"
            subtitle="En son kaydedilen fatura ve ödemeler"
            height={360}
            headerAction={
                <Button
                    endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                    size="small"
                    onClick={() => router.push(tabValue === 0 ? '/fatura' : '/kasa')}
                    sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--primary)'
                    }}
                >
                    TÜMÜ
                </Button>
            }
        >
            <Box sx={{ borderBottom: '1px solid var(--border)', mx: -2.5, px: 2.5, mt: -2.5, mb: 1, display: 'flex' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{
                        minHeight: 36,
                        '& .MuiTab-root': {
                            minHeight: 36,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 1.5
                        }
                    }}
                >
                    <Tab label="Faturalar" />
                    <Tab label="Ödemeler" />
                </Tabs>
            </Box>

            <Box sx={{ height: 240 }}>
                <DataGrid
                    rows={tabValue === 0 ? invoices : payments}
                    columns={tabValue === 0 ? invoiceColumns : paymentColumns}
                    loading={loading}
                    getRowId={(row) => row.id}
                    hideFooter
                    disableColumnMenu
                    density="compact"
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': {
                            bgcolor: 'transparent',
                            borderBottom: '1px solid var(--border)',
                            minHeight: '28px !important',
                            maxHeight: '28px !important',
                            fontSize: '0.65rem'
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid var(--border)',
                            px: 1
                        },
                        '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 }
                    }}
                />
            </Box>
        </DashboardWidget>
    );
}
