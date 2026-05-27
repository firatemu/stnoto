'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Autocomplete,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Search, TrendingUp, TrendingDown, Inventory, ShoppingCart } from '@mui/icons-material';
import MainLayout from '@/components/Layout/MainLayout';
import { useStoklar, useStokHareketler } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import TableSkeleton from '@/components/Loading/TableSkeleton';

interface Stok {
  id: string;
  stokKodu: string;
  stokAdi: string;
  marka?: string;
}

interface FaturaKalemi {
  id: string;
  birimFiyat: number;
  iskontoOrani?: number | null;
  iskontoTutari?: number | null;
  tutar: number;
}

interface FaturaInfo {
  faturaNo?: string;
  faturaTipi?: string;
  durum?: string;
  cari?: { unvan?: string; cariKodu?: string } | null;
}

interface WarehouseInfo {
  id?: string;
  name?: string;
  code?: string;
}

interface StokHareket {
  id: string;
  stokId: string;
  hareketTipi: 'GIRIS' | 'CIKIS' | 'SATIS' | 'IADE' | 'SAYIM' | 'IPTAL_GIRIS' | 'IPTAL_CIKIS' | 'SAYIM_FAZLA' | 'SAYIM_EKSIK';
  miktar: number;
  birimFiyat: number;
  aciklama?: string;
  createdAt: string;
  stok: Stok;
  warehouse?: WarehouseInfo | null;
  faturaKalemi?: (FaturaKalemi & { fatura?: FaturaInfo }) | null;
}

interface Stats {
  toplamGiris: number;
  toplamCikis: number;
  toplamSatis: number;
  toplamIade: number;
}

const TABLE_COL_COUNT = 11;

export default function MalzemeHareketleriPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStok, setSelectedStok] = useState<Stok | null>(null);
  const [hareketTipi, setHareketTipi] = useState<string>('');

  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: stoklar = [], isLoading: stoklarLoading } = useStoklar(debouncedSearch, 1000);
  const { data: hareketData, isLoading: hareketlerLoading } = useStokHareketler(
    selectedStok?.id,
    hareketTipi || undefined,
    500,
    true,
  );

  const hareketler = hareketData || [];

  const stats: Stats = {
    toplamGiris: hareketler.filter((h: StokHareket) => h.hareketTipi === 'GIRIS').reduce((sum: number, h: StokHareket) => sum + h.miktar, 0),
    toplamCikis: hareketler.filter((h: StokHareket) => h.hareketTipi === 'CIKIS').reduce((sum: number, h: StokHareket) => sum + h.miktar, 0),
    toplamSatis: hareketler.filter((h: StokHareket) => h.hareketTipi === 'SATIS').reduce((sum: number, h: StokHareket) => sum + h.miktar, 0),
    toplamIade: hareketler.filter((h: StokHareket) => h.hareketTipi === 'IADE').reduce((sum: number, h: StokHareket) => sum + h.miktar, 0),
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const getHareketIcon = (tip: string) => {
    switch (tip) {
      case 'GIRIS': return <TrendingUp sx={{ color: '#10b981' }} />;
      case 'CIKIS': return <TrendingDown sx={{ color: '#ef4444' }} />;
      case 'SATIS': return <ShoppingCart sx={{ color: '#3b82f6' }} />;
      case 'IADE': return <Inventory sx={{ color: '#f59e0b' }} />;
      case 'IPTAL_GIRIS':
      case 'IPTAL_CIKIS': return <Inventory sx={{ color: '#ef4444' }} />;
      default: return null;
    }
  };

  const getHareketColor = (hareket: StokHareket) => {
    const tip = hareket.hareketTipi;
    if (tip === 'SATIS' && hareket.faturaKalemi?.fatura?.durum === 'IPTAL') return 'error';
    switch (tip) {
      case 'GIRIS': return 'success';
      case 'CIKIS': return 'error';
      case 'SATIS': return 'primary';
      case 'IADE': return 'warning';
      case 'IPTAL_GIRIS':
      case 'IPTAL_CIKIS': return 'error';
      default: return 'default';
    }
  };

  const getHareketLabel = (hareket: StokHareket) => {
    const tip = hareket.hareketTipi;
    const faturaTipi = hareket.faturaKalemi?.fatura?.faturaTipi;
    const durum = hareket.faturaKalemi?.fatura?.durum;
    if (tip === 'SATIS' && durum === 'IPTAL') return 'Satış faturası iptal';
    if (tip === 'GIRIS' && faturaTipi === 'ALIS' && durum === 'IPTAL') return 'Satınalma faturası iptal';
    if (tip === 'IADE' && faturaTipi === 'SATIS_IADE' && durum === 'IPTAL') return 'Satış iadesi iptal';
    if (tip === 'IADE' && faturaTipi === 'ALIS_IADE' && durum === 'IPTAL') return 'Alış iadesi iptal';
    switch (tip) {
      case 'GIRIS': return faturaTipi === 'ALIS' ? 'Satınalma faturası' : 'Giriş';
      case 'CIKIS': return 'Çıkış';
      case 'SATIS': return 'Satış faturası';
      case 'IADE': return faturaTipi === 'ALIS_IADE' ? 'Alış iadesi' : faturaTipi === 'SATIS_IADE' ? 'Satış iadesi' : 'İade';
      case 'IPTAL_GIRIS':
      case 'IPTAL_CIKIS': return 'İptal';
      case 'SAYIM': return 'Sayım';
      case 'SAYIM_FAZLA': return 'Sayım fazlası';
      case 'SAYIM_EKSIK': return 'Sayım eksiği';
      default: return tip;
    }
  };

  const getFaturaDurumLabel = (hareket: StokHareket) => {
    const durum = hareket.faturaKalemi?.fatura?.durum;
    if (!durum) {
      if (hareket.hareketTipi === 'IPTAL_GIRIS' || hareket.hareketTipi === 'IPTAL_CIKIS') return 'İptal';
      return '-';
    }
    const labels: Record<string, string> = {
      ONAYLANDI: 'Onaylandı',
      ACIK: 'Beklemede',
      IPTAL: 'İptal',
      KISMEN_ODENDI: 'Kısmen Ödendi',
      KAPALI: 'Kapalı',
    };
    return labels[durum] || durum;
  };

  const getFaturaDurumColor = (hareket: StokHareket): 'success' | 'error' | 'warning' | 'default' => {
    const durum = hareket.faturaKalemi?.fatura?.durum;
    if (!durum) {
      if (hareket.hareketTipi === 'IPTAL_GIRIS' || hareket.hareketTipi === 'IPTAL_CIKIS') return 'error';
      return 'default';
    }
    if (durum === 'IPTAL') return 'error';
    if (durum === 'ONAYLANDI') return 'success';
    if (durum === 'ACIK') return 'warning';
    return 'default';
  };

  const ambarLabel = (hareket: StokHareket) => {
    const w = hareket.warehouse;
    if (!w) return '-';
    const code = w.code ? `${w.code}` : '';
    const name = w.name || '';
    if (code && name) return `${code} — ${name}`;
    return name || code || '-';
  };

  const cariLabel = (hareket: StokHareket) => {
    const c = hareket.faturaKalemi?.fatura?.cari;
    if (!c) return '-';
    const kod = c.cariKodu ? `${c.cariKodu} ` : '';
    const unvan = c.unvan || '';
    return `${kod}${unvan}`.trim() || '-';
  };

  const satirToplam = (hareket: StokHareket) => {
    if (hareket.faturaKalemi) {
      return Number(hareket.faturaKalemi.tutar);
    }
    return hareket.miktar * Number(hareket.birimFiyat);
  };

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          📦 Malzeme Hareketleri
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Stok giriş, çıkış, satış ve iade işlemlerini takip edin
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'color-mix(in srgb, var(--chart-3) 15%, transparent)', borderLeft: '4px solid var(--chart-3)' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Toplam Giriş
                  </Typography>
                  {hareketlerLoading ? (
                    <CircularProgress size={24} sx={{ mt: 1 }} />
                  ) : (
                    <Typography variant="h5" fontWeight="bold" color="#10b981">
                      {stats.toplamGiris.toLocaleString()}
                    </Typography>
                  )}
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: '#10b981', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'color-mix(in srgb, var(--destructive) 15%, transparent)', borderLeft: '4px solid var(--destructive)' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Toplam Çıkış
                  </Typography>
                  {hareketlerLoading ? (
                    <CircularProgress size={24} sx={{ mt: 1 }} />
                  ) : (
                    <Typography variant="h5" fontWeight="bold" color="#ef4444">
                      {stats.toplamCikis.toLocaleString()}
                    </Typography>
                  )}
                </Box>
                <TrendingDown sx={{ fontSize: 40, color: '#ef4444', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'color-mix(in srgb, var(--chart-1) 15%, transparent)', borderLeft: '4px solid var(--chart-1)' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Toplam Satış
                  </Typography>
                  {hareketlerLoading ? (
                    <CircularProgress size={24} sx={{ mt: 1 }} />
                  ) : (
                    <Typography variant="h5" fontWeight="bold" color="#3b82f6">
                      {stats.toplamSatis.toLocaleString()}
                    </Typography>
                  )}
                </Box>
                <ShoppingCart sx={{ fontSize: 40, color: '#3b82f6', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'color-mix(in srgb, var(--chart-2) 15%, transparent)', borderLeft: '4px solid var(--chart-2)' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Toplam İade
                  </Typography>
                  {hareketlerLoading ? (
                    <CircularProgress size={24} sx={{ mt: 1 }} />
                  ) : (
                    <Typography variant="h5" fontWeight="bold" color="#f59e0b">
                      {stats.toplamIade.toLocaleString()}
                    </Typography>
                  )}
                </Box>
                <Inventory sx={{ fontSize: 40, color: '#f59e0b', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              fullWidth
              options={stoklar}
              loading={stoklarLoading}
              getOptionLabel={(option) => `${option.stokKodu} - ${option.stokAdi}`}
              value={selectedStok}
              onChange={(_, newValue) => setSelectedStok(newValue)}
              onInputChange={(_, newValue) => setSearchTerm(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ürün Filtrele"
                  placeholder="Tüm ürünler..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {stoklarLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body2" fontWeight="600">
                        {option.stokKodu}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.stokAdi} {option.marka && `• ${option.marka}`}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Hareket Tipi</InputLabel>
              <Select
                value={hareketTipi}
                label="Hareket Tipi"
                onChange={(e) => setHareketTipi(e.target.value)}
              >
                <MenuItem value="">Tümü</MenuItem>
                <MenuItem value="GIRIS">Giriş</MenuItem>
                <MenuItem value="CIKIS">Çıkış</MenuItem>
                <MenuItem value="SATIS">Satış faturası</MenuItem>
                <MenuItem value="IADE">İade</MenuItem>
                <MenuItem value="IPTAL_GIRIS">İptal (giriş)</MenuItem>
                <MenuItem value="IPTAL_CIKIS">İptal (çıkış)</MenuItem>
                <MenuItem value="SAYIM">Sayım</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'var(--muted)' }}>
            <TableRow>
              <TableCell><strong>Malzeme</strong></TableCell>
              <TableCell><strong>Tarih</strong></TableCell>
              <TableCell><strong>Fatura No</strong></TableCell>
              <TableCell><strong>İşlem Türü</strong></TableCell>
              <TableCell><strong>Fatura Durumu</strong></TableCell>
              <TableCell><strong>Ambar</strong></TableCell>
              <TableCell><strong>Cari</strong></TableCell>
              <TableCell align="right"><strong>Miktar</strong></TableCell>
              <TableCell align="right"><strong>Birim Fiyat</strong></TableCell>
              <TableCell align="right"><strong>Toplam</strong></TableCell>
              <TableCell><strong>Açıklama</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hareketlerLoading ? (
              <TableSkeleton rows={5} columns={TABLE_COL_COUNT} />
            ) : hareketler.length === 0 ? (
              <TableRow>
                <TableCell colSpan={TABLE_COL_COUNT} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    Hareket bulunamadı
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {selectedStok ? 'Bu ürün için hareket kaydı yok' : 'Henüz hiç hareket kaydı yok'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              hareketler.map((hareket: StokHareket) => (
                <TableRow
                  key={hareket.id}
                  hover
                  sx={{ '&:hover': { bgcolor: 'var(--muted)' } }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="600" color="#191970">
                      {hareket.stok.stokKodu}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {hareket.stok.stokAdi}
                      {hareket.stok.marka ? ` • ${hareket.stok.marka}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(hareket.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'var(--foreground)' }}>
                      {hareket.faturaKalemi?.fatura?.faturaNo || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getHareketIcon(hareket.hareketTipi) ?? undefined}
                      label={getHareketLabel(hareket)}
                      color={getHareketColor(hareket) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getFaturaDurumLabel(hareket)}
                      color={getFaturaDurumColor(hareket) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{ambarLabel(hareket)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 220 }} noWrap title={cariLabel(hareket)}>
                      {cariLabel(hareket)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="600">
                      {hareket.miktar.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatMoney(Number(hareket.birimFiyat))}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="600">
                      {formatMoney(satirToplam(hareket))}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {hareket.aciklama || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Toplam {hareketler.length} hareket gösteriliyor (en fazla 500)
        </Typography>
      </Box>
    </MainLayout>
  );
}
