import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Stack,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Download,
  MoreVertical,
  Eye,
  X,
  CheckCircle2,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import MainLayout from '@/components/Layout/MainLayout';
import StatusChip from '@/components/ui/StatusChip';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useSubscriptions,
  useSubscription,
  useCancelSubscription,
  useApproveTrial,
  Subscription,
} from '@/hooks/useSubscriptions';
import { formatDateOnly, formatDateTime } from '@/lib/dateUtils';
import { toast } from 'sonner';

export default function Subscriptions() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuSubscription, setMenuSubscription] = useState<Subscription | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [detailTab, setDetailTab] = useState(0);

  // Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: subscriptionsData, isLoading } = useSubscriptions({
    search,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    plan: planFilter !== 'ALL' ? planFilter : undefined,
  });

  const { data: subscriptionDetail } = useSubscription(
    selectedSubscription?.id || ''
  );

  const cancelSubscription = useCancelSubscription();
  const approveTrial = useApproveTrial();

  const subscriptions = useMemo(() => Array.isArray(subscriptionsData) ? subscriptionsData : [], [subscriptionsData]);
  const filteredSubscriptions = subscriptions; // Filtering handled by backend hook params mostly, or client side if needed

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, subscription: Subscription) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuSubscription(subscription);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuSubscription(null);
  };

  const handleViewDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDetailModalOpen(true);
    setDetailTab(0);
    handleMenuClose();
  };

  const handleCancelClick = () => {
    if (selectedSubscription && !menuSubscription) {
      setMenuSubscription(selectedSubscription);
    }
    setCancelDialogOpen(true);
    handleMenuClose();
  };

  const handleCancel = async () => {
    const subscriptionToCancel = menuSubscription || selectedSubscription;
    if (!subscriptionToCancel) return;

    try {
      await cancelSubscription.mutateAsync(subscriptionToCancel.id);
      toast.success('Abonelik iptal edildi');
      setCancelDialogOpen(false);
      setMenuSubscription(null);
      if (selectedSubscription) {
        setDetailModalOpen(false);
        setSelectedSubscription(null);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Abonelik iptal edilirken hata oluştu');
    }
  };

  const handleApproveClick = () => {
    if (selectedSubscription && !menuSubscription) {
      setMenuSubscription(selectedSubscription);
    }
    setApproveDialogOpen(true);
    handleMenuClose();
  };

  const handleApprove = async () => {
    const subscriptionToApprove = menuSubscription || selectedSubscription;
    if (!subscriptionToApprove?.tenantId) return;

    try {
      await approveTrial.mutateAsync(subscriptionToApprove.tenantId);
      toast.success('Deneme sürümü onaylandı');
      setApproveDialogOpen(false);
      setMenuSubscription(null);
      if (selectedSubscription) {
        setDetailModalOpen(false);
        setSelectedSubscription(null);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Onaylama sırasında hata oluştu');
    }
  };

  const summaryCards = useMemo(() => [
    {
      title: 'Aktif Abonelik',
      value: filteredSubscriptions.filter((s) => s?.status === 'ACTIVE').length,
      color: theme.palette.success.main,
    },
    {
      title: 'Deneme Sürümü',
      value: filteredSubscriptions.filter((s) => s?.status === 'TRIAL').length,
      color: theme.palette.info.main,
    },
    {
      title: 'İptal Bekleyen',
      value: filteredSubscriptions.filter((s) => s?.status === 'CANCELED').length,
      color: theme.palette.error.main,
    },
    {
      title: 'Bekleyen Onay',
      value: filteredSubscriptions.filter((s) => s?.status === 'PENDING').length,
      color: theme.palette.warning.main,
    },
    {
      title: 'Toplam MRR',
      value: `₺${filteredSubscriptions
        .filter((s) => s?.status === 'ACTIVE' && s?.plan?.price)
        .reduce((sum: number, s: Subscription) => sum + (s?.plan?.price || 0), 0)
        .toLocaleString('tr-TR')}`,
      color: theme.palette.primary.main,
    },
  ], [filteredSubscriptions, theme]);

  const columns: ColumnDef<Subscription>[] = useMemo(() => [
    {
      accessorKey: 'tenant',
      header: 'Kullanıcı',
      cell: ({ row }) => {
        const tenant = row.original.tenant;
        const user = tenant?.users?.[0];
        return (
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {user?.fullName || user?.email || tenant?.name || 'N/A'}
            </Typography>
            {user?.email && (
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      accessorKey: 'plan',
      header: 'Plan',
      cell: ({ row }) => {
        const plan = row.original.plan;
        return (
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {plan?.name || 'N/A'}
            </Typography>
            {plan?.price !== undefined && (
              <Typography variant="caption" color="text.secondary">
                ₺{plan.price.toLocaleString('tr-TR')}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Durum',
      cell: ({ row }) => <StatusChip status={row.original.status} />,
    },
    {
      accessorKey: 'startDate',
      header: 'Başlangıç',
      cell: ({ row }) => (
        <Typography variant="body2">
          {formatDateOnly(row.original.startDate)}
        </Typography>
      ),
    },
    {
      accessorKey: 'endDate',
      header: 'Bitiş / Sonraki Ödeme',
      cell: ({ row }) => {
        const sub = row.original;
        let date = sub.endDate;
        if (sub.nextBillingDate) {
          date = sub.nextBillingDate;
        }
        return (
          <Typography variant="body2">
            {formatDateOnly(date)}
          </Typography>
        );
      },
    },
    {
      id: 'actions',
      header: 'İşlemler',
      cell: ({ row }) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, row.original)}
        >
          <MoreVertical size={16} />
        </IconButton>
      ),
    },
  ], []);

  const table = useReactTable({
    data: filteredSubscriptions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onPaginationChange: setPagination,
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPagination((prev) => ({ ...prev, pageIndex: newPage }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: parseInt(event.target.value, 10),
      pageIndex: 0,
    }));
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem' },
              color: theme.palette.primary.main,
            }}
          >
            Abonelikler
          </Typography>
          <Button
            variant="contained"
            startIcon={<Download size={18} />}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
              fontWeight: 600,
              px: 3,
            }}
          >
            Export Excel
          </Button>
        </Stack>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {summaryCards.map((card, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: theme.shadows[1],
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="body2" color="text.secondary" fontWeight="500" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ color: card.color }}
                  >
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filters */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              placeholder="Kullanıcı adı, email veya plan ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: <Search size={18} style={{ marginRight: 8, opacity: 0.5 }} />,
              }}
              sx={{ flex: 1 }}
            />
            <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
              <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={statusFilter}
                  label="Durum"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="ALL">Tümü</MenuItem>
                  <MenuItem value="ACTIVE">Aktif</MenuItem>
                  <MenuItem value="TRIAL">Deneme</MenuItem>
                  <MenuItem value="PENDING">Beklemede</MenuItem>
                  <MenuItem value="CANCELED">İptal</MenuItem>
                  <MenuItem value="EXPIRED">Süresi Dolmuş</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
                <InputLabel>Plan</InputLabel>
                <Select
                  value={planFilter}
                  label="Plan"
                  onChange={(e) => setPlanFilter(e.target.value)}
                >
                  <MenuItem value="ALL">Tümü</MenuItem>
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Paper>

        {/* Content: Table or Cards */}
        {isLoading ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography>Yükleniyor...</Typography>
          </Paper>
        ) : isMobile ? (
          // Mobile Card View
          <Stack spacing={2}>
            {table.getRowModel().rows.map((row) => (
              <Card
                key={row.id}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: 'none',
                }}
                onClick={() => handleViewDetails(row.original)}
              >
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box>
                      {(() => {
                        const tenant = row.original.tenant;
                        const user = tenant?.users?.[0];
                        return (
                          <>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {user?.fullName || tenant?.name || 'N/A'}
                            </Typography>
                            {user?.email && (
                              <Typography variant="body2" color="text.secondary">
                                {user.email}
                              </Typography>
                            )}
                          </>
                        )
                      })()}
                    </Box>
                    <Box onClick={(e) => e.stopPropagation()}>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, row.original)}>
                        <MoreVertical size={18} />
                      </IconButton>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Plan:</Typography>
                      <Typography variant="body2" fontWeight="medium">{row.original.plan?.name || 'N/A'}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Durum:</Typography>
                      <StatusChip status={row.original.status} />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Başlangıç:</Typography>
                      <Typography variant="body2">{formatDateOnly(row.original.startDate)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Sonraki Ödeme:</Typography>
                      <Typography variant="body2">
                        {row.original.nextBillingDate ? formatDateOnly(row.original.nextBillingDate) : formatDateOnly(row.original.endDate)}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <Typography textAlign="center" color="text.secondary" py={4}>Veri bulunamadı</Typography>
            )}
            {table.getRowModel().rows.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredSubscriptions.length}
                rowsPerPage={pagination.pageSize}
                page={pagination.pageIndex}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Satır:"
                sx={{
                  '.MuiTablePagination-selectLabel': { mb: 0 },
                  '.MuiTablePagination-displayedRows': { mb: 0 },
                }}
              />
            )}
          </Stack>
        ) : (
          // Desktop Table View
          <Paper
            sx={{
              width: '100%',
              mb: 2,
              borderRadius: 2,
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
            }}
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} sx={{ bgcolor: theme.palette.background.default }}>
                      {headerGroup.headers.map((header) => (
                        <TableCell
                          key={header.id}
                          align="left"
                          padding="normal"
                          sx={{ fontWeight: 600, color: theme.palette.text.secondary }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}>
                            <Box component="span">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </Box>
                            {header.column.getCanSort() && (
                              <ArrowUpDown size={14} style={{ opacity: 0.5 }} />
                            )}
                          </Stack>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableHead>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">Veri bulunamadı</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        hover
                        key={row.id}
                        onClick={() => handleViewDetails(row.original)}
                        sx={{ cursor: 'pointer' }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredSubscriptions.length}
              rowsPerPage={pagination.pageSize}
              page={pagination.pageIndex}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Sayfa başına:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
            />
          </Paper>
        )}

        {/* Modal Declarations */}

        {/* Detail Modal */}
        <Dialog
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          {selectedSubscription && subscriptionDetail && (
            <>
              <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold">
                  Abonelik Detayları
                </Typography>
                <IconButton onClick={() => setDetailModalOpen(false)} size="small">
                  <X size={20} />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ mb: 3 }}>
                  <Tab label="Genel" />
                  <Tab label="Ödeme Planı" />
                  <Tab label="İşlem Geçmişi" />
                </Tabs>

                {detailTab === 0 && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Kullanıcı
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {subscriptionDetail.tenant?.users?.[0]?.fullName ||
                          subscriptionDetail.tenant?.users?.[0]?.email ||
                          subscriptionDetail.tenant?.name ||
                          'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Email
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {subscriptionDetail.tenant?.users?.[0]?.email || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Plan
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {subscriptionDetail.plan?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Durum
                      </Typography>
                      <StatusChip status={subscriptionDetail.status} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Başlangıç Tarihi
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDateOnly(subscriptionDetail.startDate)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Bitiş Tarihi
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDateOnly(subscriptionDetail.endDate)}
                      </Typography>
                    </Grid>
                    {subscriptionDetail.nextBillingDate && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Sonraki Ödeme
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDateOnly(subscriptionDetail.nextBillingDate)}
                        </Typography>
                      </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Otomatik Yenileme
                      </Typography>
                      <Chip
                        label={subscriptionDetail.autoRenew ? 'Aktif' : 'Pasif'}
                        color={subscriptionDetail.autoRenew ? 'success' : 'default'}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Oluşturulma Tarihi
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDateTime(subscriptionDetail.createdAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                )}

                {detailTab === 1 && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Plan Fiyatı
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        ₺{subscriptionDetail.plan?.price?.toLocaleString('tr-TR') || '0'}
                      </Typography>
                    </Grid>
                    {subscriptionDetail.lastBillingDate && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Son Ödeme Tarihi
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDateOnly(subscriptionDetail.lastBillingDate)}
                        </Typography>
                      </Grid>
                    )}
                    {subscriptionDetail.trialEndsAt && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Deneme Bitiş Tarihi
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDateOnly(subscriptionDetail.trialEndsAt)}
                        </Typography>
                      </Grid>
                    )}
                    {subscriptionDetail.iyzicoSubscriptionRef && (
                      <Grid size={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          iyzico Abonelik Referansı
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {subscriptionDetail.iyzicoSubscriptionRef}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                )}

                {detailTab === 2 && (
                  <Box>
                    {subscriptionDetail.payments && subscriptionDetail.payments.length > 0 ? (
                      <Box>
                        {subscriptionDetail.payments.map((payment: any, index: number) => (
                          <Box key={payment.id} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body1" fontWeight="medium">
                                ₺{payment.amount.toLocaleString('tr-TR')}
                              </Typography>
                              <StatusChip status={payment.status} />
                            </Box>
                            {payment.paidAt && (
                              <Typography variant="caption" color="text.secondary">
                                {formatDateTime(payment.paidAt)}
                              </Typography>
                            )}
                            {index < subscriptionDetail.payments!.length - 1 && <Divider sx={{ mt: 2 }} />}
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        İşlem geçmişi bulunmuyor
                      </Typography>
                    )}
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={() => setDetailModalOpen(false)}>Kapat</Button>
                {subscriptionDetail.status === 'PENDING' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle2 size={18} />}
                    onClick={handleApproveClick}
                  >
                    Deneme Onayla
                  </Button>
                )}
                {subscriptionDetail.status !== 'CANCELED' && subscriptionDetail.status !== 'EXPIRED' && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<X size={18} />}
                    onClick={handleCancelClick}
                  >
                    İptal Et
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Menü */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => menuSubscription && handleViewDetails(menuSubscription)}>
            <Eye size={16} style={{ marginRight: 8 }} />
            Detayları Gör
          </MenuItem>
          {menuSubscription?.status === 'PENDING' && (
            <MenuItem onClick={handleApproveClick}>
              <CheckCircle2 size={16} style={{ marginRight: 8 }} />
              Deneme Onayla
            </MenuItem>
          )}
          {menuSubscription?.status !== 'CANCELED' && menuSubscription?.status !== 'EXPIRED' && (
            <MenuItem onClick={handleCancelClick} sx={{ color: 'error.main' }}>
              <X size={16} style={{ marginRight: 8 }} />
              İptal Et
            </MenuItem>
          )}
        </Menu>

        {/* Onay Dialog'ları */}
        <ConfirmDialog
          open={cancelDialogOpen}
          title="Abonelik İptali"
          description={`${(menuSubscription || selectedSubscription)?.tenant?.users?.[0]?.fullName || (menuSubscription || selectedSubscription)?.tenant?.name || 'Bu'} aboneliğini iptal etmek istediğinize emin misiniz?`}
          confirmText="İptal Et"
          cancelText="Vazgeç"
          severity="warning"
          onConfirm={handleCancel}
          onCancel={() => {
            setCancelDialogOpen(false);
            setMenuSubscription(null);
          }}
        />

        <ConfirmDialog
          open={approveDialogOpen}
          title="Deneme Onayı"
          description={`${(menuSubscription || selectedSubscription)?.tenant?.users?.[0]?.fullName || (menuSubscription || selectedSubscription)?.tenant?.name || 'Bu'} deneme sürümünü onaylamak istediğinize emin misiniz?`}
          confirmText="Onayla"
          cancelText="Vazgeç"
          severity="info"
          onConfirm={handleApprove}
          onCancel={() => {
            setApproveDialogOpen(false);
            setMenuSubscription(null);
          }}
        />
      </Box>
    </MainLayout>
  );
}

