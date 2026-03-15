'use client';

import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Skeleton, Alert, ToggleButton, ToggleButtonGroup, Collapse, IconButton } from '@mui/material';
import MainLayout from '@/components/Layout/MainLayout';
import PageContainer from '@/components/common/PageContainer';
import StatsCards from '@/components/dashboard/StatsCards';
import CollectionStats from '@/components/dashboard/CollectionStats';
import CollectionChart from '@/components/dashboard/CollectionChart';
import InventoryOverview from '@/components/dashboard/InventoryOverview';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import Reminders from '@/components/dashboard/Reminders';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardStats, useMonthlySales, useCollectionData, useInventoryData, useTransactionsData } from '@/hooks/useDashboard';
import { NotificationsActiveOutlined } from '@mui/icons-material';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [tenantSettings, setTenantSettings] = useState<any>(null);

  // Fetch data with React Query (optimized caching)
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: monthlySales, isLoading: salesLoading } = useMonthlySales();
  const { data: collectionData, isLoading: collectionLoading } = useCollectionData(period);
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryData();
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactionsData(5);

  // Fetch tenant settings
  useEffect(() => {
    fetchTenantSettings();
  }, []);

  const fetchTenantSettings = async () => {
    try {
      const axios = (await import('@/lib/axios')).default;
      const res = await axios.get('/tenants/settings');
      setTenantSettings(res.data);
    } catch (error) {
      console.error('Tenant settings loading error:', error);
    }
  };

  const handlePeriodChange = (event: React.MouseEvent<HTMLElement>, newPeriod: 'daily' | 'weekly' | 'monthly' | null) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  // Combine stats
  const aylikSatis = monthlySales || 0;
  const stats = {
    toplamStok: statsData?.toplamStok || 0,
    cariSayisi: statsData?.cariSayisi || 0,
    aylikSatis,
    karMarji: aylikSatis * 0.15,
  };

  const loading = statsLoading || salesLoading;

  return (
    <MainLayout>
      <PageContainer>
        {/* Header with Company Logo & Welcome */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {loading ? (
                <Skeleton variant="rectangular" width={56} height={56} />
              ) : tenantSettings?.logoUrl ? (
                <Box component="img" src={tenantSettings.logoUrl} sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }} />
              ) : (
                <Box sx={{ width: 14, height: 42, bgcolor: 'var(--primary)', borderRadius: '999px' }} />
              )}
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {loading ? <Skeleton width={180} /> : (tenantSettings?.companyName || 'Hoş Geldiniz')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>
                {loading ? <Skeleton width={120} /> : `Merhaba, ${user?.fullName || 'Kullanıcı'} 👋`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Alert severity="success" icon={false} sx={{ py: 0, px: 1.5, fontWeight: 600, borderRadius: '8px', fontSize: '0.8rem' }}>
              Kurumsal Panel
            </Alert>
            <IconButton
              onClick={() => setRemindersOpen(!remindersOpen)}
              sx={{
                width: 40,
                height: 40,
                bgcolor: remindersOpen ? 'var(--primary)' : 'var(--card)',
                color: remindersOpen ? 'var(--primary-foreground)' : 'var(--foreground)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <NotificationsActiveOutlined fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* 1. Quick Stats */}
        <StatsCards stats={stats} loading={loading} />

        {/* 2. Collection & Payment Overview */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, mt: 3 }}>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
            Tahsilat ve Ödeme Analizi
          </Typography>

          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={handlePeriodChange}
            size="small"
            sx={{
              bgcolor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              '& .MuiToggleButton-root': {
                border: 'none',
                px: 1.5,
                py: 0.4,
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                color: 'var(--muted-foreground)',
                '&.Mui-selected': {
                  bgcolor: 'var(--primary)',
                  color: 'white',
                  '&:hover': { bgcolor: 'var(--primary)' }
                }
              }
            }}
          >
            <ToggleButton value="daily">Günlük</ToggleButton>
            <ToggleButton value="weekly">Haftalık</ToggleButton>
            <ToggleButton value="monthly">Aylık</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <CollectionStats data={collectionData?.stats || {}} period={period} loading={collectionLoading} />

        <Grid container spacing={2.5} sx={{ mt: 3 }}>
          {/* Collection Chart - Full Width */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <CollectionChart data={collectionData?.chartData || []} period={period} loading={collectionLoading} />
          </Grid>

          {/* Inventory - Full width on mobile, half on desktop */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <InventoryOverview
              criticalStock={inventoryData?.criticalStock || []}
              categoryDistribution={inventoryData?.categoryDistribution || []}
              loading={inventoryLoading}
            />
          </Grid>

          {/* Recent Transactions - Full Width */}
          <Grid size={{ xs: 12 }}>
            <RecentTransactions
              invoices={transactionsData?.invoices || []}
              payments={transactionsData?.payments || []}
              loading={transactionsLoading}
            />
          </Grid>

          {/* Reminders - Collapsible */}
          <Grid size={{ xs: 12 }}>
            <Collapse in={remindersOpen} timeout={300}>
              <Box sx={{ mt: 2 }}>
                <Reminders />
              </Box>
            </Collapse>
          </Grid>
        </Grid>
      </PageContainer>
    </MainLayout>
  );
}