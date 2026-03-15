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
  const currentUser = useAuthStore((state: any) => state.user);
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
        {/* COMPACT HEADER */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '10px',
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
                <Skeleton variant="rectangular" width={48} height={48} />
              ) : tenantSettings?.logoUrl ? (
                <Box component="img" src={tenantSettings.logoUrl} sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }} />
              ) : (
                <Box sx={{ width: 12, height: 36, bgcolor: 'var(--primary)', borderRadius: '999px' }} />
              )}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {loading ? <Skeleton width={150} /> : (tenantSettings?.companyName || 'Kurumsal Panel')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>
                {loading ? <Skeleton width={100} /> : `Merhaba, ${currentUser?.fullName || 'Kullanıcı'} 👋`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={handlePeriodChange}
              size="small"
              sx={{
                mr: 1,
                bgcolor: 'var(--card)',
                height: 32,
                '& .MuiToggleButton-root': {
                  border: '1px solid var(--border)',
                  px: 1.2,
                  py: 0,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: 'var(--primary)',
                    color: 'white',
                    borderColor: 'var(--primary)',
                    '&:hover': { bgcolor: 'var(--primary)' }
                  }
                }
              }}
            >
              <ToggleButton value="daily">GÜN</ToggleButton>
              <ToggleButton value="weekly">HF</ToggleButton>
              <ToggleButton value="monthly">AY</ToggleButton>
            </ToggleButtonGroup>

            <IconButton
              size="small"
              onClick={() => setRemindersOpen(!remindersOpen)}
              sx={{
                width: 32,
                height: 32,
                bgcolor: remindersOpen ? 'var(--primary)' : 'var(--card)',
                color: remindersOpen ? 'var(--primary-foreground)' : 'var(--foreground)',
                border: '1px solid var(--border)',
              }}
            >
              <NotificationsActiveOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        <CollectionStats
          data={collectionData?.stats || {
            currentMonthCollection: 0,
            currentMonthPayment: 0,
            previousMonthCollection: 0,
            previousMonthPayment: 0
          }}
          period={period}
          loading={collectionLoading}
        />

        <Grid container spacing={1.5} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <CollectionChart data={collectionData?.chartData || []} period={period} loading={collectionLoading} />
          </Grid>

          <Grid item xs={12}>
            <InventoryOverview
              criticalStock={inventoryData?.criticalStock || []}
              categoryDistribution={inventoryData?.categoryDistribution || []}
              loading={inventoryLoading}
            />
          </Grid>

          <Grid item xs={12}>
            <RecentTransactions
              invoices={transactionsData?.invoices || []}
              payments={transactionsData?.payments || []}
              loading={transactionsLoading}
            />
          </Grid>

          <Grid item xs={12}>
            <Collapse in={remindersOpen} timeout={300}>
              <Box sx={{ mt: 1 }}>
                <Reminders />
              </Box>
            </Collapse>
          </Grid>
        </Grid>
      </PageContainer>
    </MainLayout>
  );
}