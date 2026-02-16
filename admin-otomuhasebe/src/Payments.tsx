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
  RotateCcw,
  FileText,
  Copy,
  ArrowUpDown,
  Search,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import MainLayout from '@/components/Layout/MainLayout';
import StatusChip from '@/components/ui/StatusChip';
import { usePayments, Payment, useRefundPayment } from '@/hooks/usePayments';
import { toast } from 'sonner';

export default function Payments() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuPayment, setMenuPayment] = useState<Payment | null>(null);

  // Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading } = usePayments({ search });
  const refundPayment = useRefundPayment();

  const payments = useMemo(() => {
    let result = data || [];
    if (statusFilter !== 'ALL') {
      result = result.filter((p: Payment) => p.status === statusFilter);
    }
    return result;
  }, [data, statusFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, payment: Payment) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuPayment(payment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuPayment(null);
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailModalOpen(true);
    handleMenuClose();
  };

  const handleRefund = async () => {
    if (menuPayment) {
      try {
        await refundPayment.mutateAsync(menuPayment.id);
        toast.success('İade işlemi başlatıldı');
        handleMenuClose();
      } catch (error) {
        toast.error('İade işlemi başlatılırken hata oluştu');
      }
    }
  };

  const handleCopyIyzicoRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    toast.success('Kopyalandı');
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const summaryCards = useMemo(() => [
    {
      title: 'Bugünkü Gelir',
      value: `₺${payments
        .filter((p: Payment) => {
          const paymentDate = new Date(p.createdAt);
          return p.status === 'SUCCESS' && paymentDate >= today && paymentDate <= todayEnd;
        })
        .reduce((sum: number, p: Payment) => sum + p.amount, 0)
        .toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      color: 'success',
    },
    {
      title: 'Başarılı İşlem',
      value: payments.filter((p: Payment) => p.status === 'SUCCESS').length,
      color: 'success',
    },
    {
      title: 'Başarısız İşlem',
      value: payments.filter((p: Payment) => p.status === 'FAILED').length,
      color: 'error',
    },
    {
      title: 'İade Edilen',
      value: payments.filter((p: Payment) => p.status === 'REFUNDED').length,
      color: 'warning',
    },
  ], [payments]);

  const columns = useMemo<ColumnDef<Payment>[]>(() => [
    {
      accessorKey: 'id',
      header: 'İşlem No',
      cell: ({ row }) => (
        <Typography variant="body2" fontFamily="monospace">
          {row.original.id.substring(0, 8)}...
        </Typography>
      ),
    },
    {
      accessorKey: 'subscription',
      header: 'Kullanıcı',
      cell: ({ row }) => {
        const user = row.original.subscription?.tenant?.users?.[0];
        return (
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {user?.fullName || 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email || ''}
            </Typography>
          </Box>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Tutar',
      cell: ({ row }) => (
        <Typography variant="body2" fontWeight="medium">
          ₺{row.original.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Durum',
      cell: ({ row }) => <StatusChip status={row.original.status} />,
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Ödeme Yöntemi',
      cell: ({ row }) => (
        <Chip
          label={row.original.paymentMethod || 'N/A'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      accessorKey: 'iyzicoPaymentId',
      header: 'iyzico Ref',
      cell: ({ row }) => (
        row.original.iyzicoPaymentId ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" fontFamily="monospace">
              {row.original.iyzicoPaymentId.substring(0, 12)}...
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyIyzicoRef(row.original.iyzicoPaymentId!);
              }}
            >
              <Copy size={14} />
            </IconButton>
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary">N/A</Typography>
        )
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Tarih',
      cell: ({ row }) =>
        format(new Date(row.original.createdAt), 'dd MMM yyyy HH:mm', { locale: tr }),
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
    data: payments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    table.setPageIndex(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    table.setPageSize(parseInt(event.target.value, 10));
    table.setPageIndex(0);
  };

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            fontSize: { xs: '1.75rem', sm: '2rem' },
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Ödemeler
        </Typography>
        <Button
          variant="contained"
          startIcon={<Download size={18} />}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: 'white',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
          }}
        >
          Export Excel
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: theme.shadows[1],
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                },
                border: `1px solid ${card.color === 'success'
                  ? alpha(theme.palette.success.main, 0.2)
                  : card.color === 'error'
                    ? alpha(theme.palette.error.main, 0.2)
                    : alpha(theme.palette.warning.main, 0.2)
                  }`,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                gutterBottom
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  mb: 1.5,
                }}
              >
                {card.title}
              </Typography>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  color: card.color === 'success'
                    ? theme.palette.success.main
                    : card.color === 'error'
                      ? theme.palette.error.main
                      : theme.palette.warning.main,
                  fontSize: { xs: '1.75rem', sm: '2rem' },
                }}
              >
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          boxShadow: theme.shadows[1],
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="İşlem No, iyzico ref veya email ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <Search size={20} style={{ marginRight: 8, color: theme.palette.text.secondary }} />,
            }}
            sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}
          />
          <FormControl size="small" sx={{ minWidth: 180, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Durum</InputLabel>
            <Select
              value={statusFilter}
              label="Durum"
              onChange={(e) => setStatusFilter(e.target.value)}
              startAdornment={<Filter size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />}
            >
              <MenuItem value="ALL">Tümü</MenuItem>
              <MenuItem value="SUCCESS">Başarılı</MenuItem>
              <MenuItem value="PENDING">Beklemede</MenuItem>
              <MenuItem value="FAILED">Başarısız</MenuItem>
              <MenuItem value="REFUNDED">İade Edildi</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Mobile Card View */}
      {isMobile ? (
        <Stack spacing={2}>
          {table.getRowModel().rows.map((row) => (
            <Card key={row.id} sx={{ borderRadius: 2, boxShadow: theme.shadows[1] }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {row.original.subscription?.tenant?.users?.[0]?.fullName || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.original.subscription?.tenant?.users?.[0]?.email || ''}
                    </Typography>
                  </Box>
                  <StatusChip status={row.original.status} />
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Grid container spacing={1}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Tutar</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      ₺{row.original.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Tarih</Typography>
                    <Typography variant="body2">
                      {format(new Date(row.original.createdAt), 'dd MMM yyyy', { locale: tr })}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">İşlem No</Typography>
                    <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                      {row.original.id}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Eye size={16} />}
                    onClick={() => handleViewDetails(row.original)}
                  >
                    Detaylar
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
          <TablePagination
            component="div"
            count={table.getFilteredRowModel().rows.length}
            page={pagination.pageIndex}
            onPageChange={handleChangePage}
            rowsPerPage={pagination.pageSize}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Sayfa başına:"
          />
        </Stack>
      ) : (
        /* Desktop Table View */
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: theme.shadows[1], overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableCell
                      key={header.id}
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">Yükleniyor...</Typography>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">Kayıt bulunamadı</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
                    }}
                    onClick={() => handleViewDetails(row.original)}
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
          <TablePagination
            component="div"
            count={table.getFilteredRowModel().rows.length}
            page={pagination.pageIndex}
            onPageChange={handleChangePage}
            rowsPerPage={pagination.pageSize}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Sayfa başına:"
          />
        </TableContainer>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => menuPayment && handleViewDetails(menuPayment)}>
          <Eye size={16} style={{ marginRight: 8 }} />
          Detayları Gör
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <FileText size={16} style={{ marginRight: 8 }} />
          Fatura İndir
        </MenuItem>
        {menuPayment?.status === 'SUCCESS' && (
          <MenuItem onClick={handleRefund} sx={{ color: 'warning.main' }}>
            <RotateCcw size={16} style={{ marginRight: 8 }} />
            İade Et
          </MenuItem>
        )}
        {menuPayment?.status === 'FAILED' && (
          <MenuItem onClick={handleMenuClose}>
            <RotateCcw size={16} style={{ marginRight: 8 }} />
            Yeniden Dene
          </MenuItem>
        )}
      </Menu>

      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedPayment && (
          <>
            <DialogTitle sx={{ fontWeight: 600 }}>Ödeme Detayları</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    İşlem No
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {selectedPayment.id}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tutar
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    ₺{selectedPayment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Durum
                  </Typography>
                  <StatusChip status={selectedPayment.status} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Ödeme Yöntemi
                  </Typography>
                  <Chip label={selectedPayment.paymentMethod || 'N/A'} size="small" variant="outlined" />
                </Grid>

                {selectedPayment.iyzicoPaymentId && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      iyzico Payment ID
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontFamily="monospace">
                        {selectedPayment.iyzicoPaymentId}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyIyzicoRef(selectedPayment.iyzicoPaymentId!)}
                      >
                        <Copy size={16} />
                      </IconButton>
                    </Box>
                  </Grid>
                )}
                {selectedPayment.failureReason && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Hata Nedeni
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      {selectedPayment.failureReason}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailModalOpen(false)}>Kapat</Button>
              {selectedPayment.status === 'SUCCESS' && (
                <Button variant="contained" color="warning" onClick={handleRefund}>
                  İade Et
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </MainLayout>
  );
}

