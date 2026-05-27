'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Snackbar,
  Grid,
  ListSubheader,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Info,
  Settings,
  Close,
  Tag,
} from '@mui/icons-material';
import MainLayout from '@/components/Layout/MainLayout';
import axios from '@/lib/axios';

interface CodeTemplate {
  id: string;
  module: string;
  name: string;
  prefix: string;
  digitCount: number;
  currentValue: number;
  includeYear?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const moduleOptions = [
  { value: 'WAREHOUSE', label: 'Depo', group: 'Stok & Depo' },
  { value: 'PRODUCT', label: 'Ürün / Stok', group: 'Stok & Depo' },
  { value: 'INVENTORY_COUNT', label: 'Sayım', group: 'Stok & Depo' },
  { value: 'WAREHOUSE_TRANSFER', label: 'Depo Transfer Fişi', group: 'Stok & Depo' },
  { value: 'CUSTOMER', label: 'Cari / Müşteri', group: 'Cari & Finans' },
  { value: 'CASHBOX', label: 'Kasa', group: 'Cari & Finans' },
  { value: 'TAHSILAT', label: 'Tahsilat Belgesi', group: 'Cari & Finans' },
  { value: 'ODEME', label: 'Ödeme Belgesi', group: 'Cari & Finans' },
  { value: 'CAPRAZ_ODEME', label: 'Çapraz Ödeme', group: 'Cari & Finans' },
  { value: 'INVOICE_SALES', label: 'Satış Faturası', group: 'Fatura & İrsaliye' },
  { value: 'INVOICE_PURCHASE', label: 'Alış Faturası', group: 'Fatura & İrsaliye' },
  { value: 'DELIVERY_NOTE_SALES', label: 'Satış İrsaliyesi', group: 'Fatura & İrsaliye' },
  { value: 'DELIVERY_NOTE_PURCHASE', label: 'Alış İrsaliyesi', group: 'Fatura & İrsaliye' },
  { value: 'SERVICE_INVOICE', label: 'Servis Faturası', group: 'Fatura & İrsaliye' },
  { value: 'ORDER_SALES', label: 'Satış Siparişi', group: 'Sipariş & Teklif' },
  { value: 'ORDER_PURCHASE', label: 'Satın Alma Siparişi', group: 'Sipariş & Teklif' },
  { value: 'TEKLIF', label: 'Teklif', group: 'Sipariş & Teklif' },
  { value: 'PERSONNEL', label: 'Personel', group: 'İnsan Kaynakları & Servis' },
  { value: 'TECHNICIAN', label: 'Teknisyen', group: 'İnsan Kaynakları & Servis' },
  { value: 'WORK_ORDER', label: 'İş Emri', group: 'İnsan Kaynakları & Servis' },
];

const MODULE_DEFAULTS: Record<
  string,
  { name: string; prefix: string; digitCount: number; includeYear?: boolean }
> = {
  WAREHOUSE: { name: 'Depo Kodu', prefix: 'D', digitCount: 3 },
  CASHBOX: { name: 'Kasa Kodu', prefix: 'K', digitCount: 3 },
  PERSONNEL: { name: 'Personel Kodu', prefix: 'P', digitCount: 4 },
  PRODUCT: { name: 'Ürün Kodu', prefix: 'ST', digitCount: 4 },
  CUSTOMER: { name: 'Cari Kodu', prefix: 'C', digitCount: 4 },
  INVOICE_SALES: { name: 'Satış Faturası No', prefix: 'SF', digitCount: 9, includeYear: true },
  INVOICE_PURCHASE: { name: 'Alış Faturası No', prefix: 'AF', digitCount: 5 },
  ORDER_SALES: { name: 'Satış Siparişi No', prefix: 'SS', digitCount: 5 },
  ORDER_PURCHASE: { name: 'Satın Alma Siparişi No', prefix: 'SA', digitCount: 5 },
  INVENTORY_COUNT: { name: 'Sayım No', prefix: 'SY', digitCount: 5 },
  TEKLIF: { name: 'Teklif No', prefix: 'TK', digitCount: 5 },
  DELIVERY_NOTE_SALES: { name: 'Satış İrsaliyesi No', prefix: 'SI', digitCount: 5 },
  DELIVERY_NOTE_PURCHASE: { name: 'Alış İrsaliyesi No', prefix: 'AI', digitCount: 5 },
  WAREHOUSE_TRANSFER: { name: 'Depo Transfer Fişi No', prefix: 'TRF', digitCount: 6 },
  TECHNICIAN: { name: 'Teknisyen Kodu', prefix: 'T', digitCount: 3 },
  WORK_ORDER: { name: 'İş Emri No', prefix: 'IE', digitCount: 5 },
  SERVICE_INVOICE: { name: 'Servis Faturası No', prefix: 'SRV', digitCount: 5 },
  TAHSILAT: { name: 'Tahsilat Belge No', prefix: 'TH', digitCount: 6 },
  ODEME: { name: 'Ödeme Belge No', prefix: 'OD', digitCount: 6 },
  CAPRAZ_ODEME: { name: 'Çapraz Ödeme Belge No', prefix: 'CAP', digitCount: 6 },
};

const moduleGroups = Array.from(new Set(moduleOptions.map((o) => o.group)));

function buildPreviewCode(data: {
  prefix: string;
  digitCount: number;
  currentValue: number;
  includeYear?: boolean;
}) {
  const next = data.currentValue + 1;
  const padded = String(next).padStart(data.digitCount, '0');
  if (data.includeYear) {
    return `${data.prefix}${new Date().getFullYear()}${padded}`;
  }
  return `${data.prefix}${padded}`;
}

// Template Form Dialog Component - Local State ile Ping Sorunu Çözümü
interface TemplateFormDialogProps {
  open: boolean;
  initialFormData: {
    module: string;
    name: string;
    prefix: string;
    digitCount: number;
    currentValue: number;
    includeYear: boolean;
    isActive: boolean;
  };
  editingTemplate: CodeTemplate | null;
  onClose: () => void;
  onSubmit: (data: {
    module: string;
    name: string;
    prefix: string;
    digitCount: number;
    currentValue: number;
    includeYear: boolean;
    isActive: boolean;
  }) => void;
}

const TemplateFormDialog = memo(({
  open,
  initialFormData,
  editingTemplate,
  onClose,
  onSubmit,
}: TemplateFormDialogProps) => {
  // Local State - Parent'ı etkilemez, ping sorunu çözülür
  const [localFormData, setLocalFormData] = useState(initialFormData);

  // initialFormData değiştiğinde local state'i güncelle
  useEffect(() => {
    setLocalFormData(initialFormData);
  }, [initialFormData]);

  const applyModuleDefaults = useCallback((module: string) => {
    const defaults = MODULE_DEFAULTS[module];
    if (!defaults) return;
    setLocalFormData((prev) => ({
      ...prev,
      module,
      name: defaults.name,
      prefix: defaults.prefix,
      digitCount: defaults.digitCount,
      includeYear: defaults.includeYear ?? false,
    }));
  }, []);

  // Local değişiklik fonksiyonu - Sadece dialog re-render olur
  const handleLocalChange = useCallback((field: string, value: any) => {
    if (field === 'module' && !editingTemplate) {
      applyModuleDefaults(value);
      return;
    }
    setLocalFormData((prev) => ({ ...prev, [field]: value }));
  }, [applyModuleDefaults, editingTemplate]);

  // Local submit - Parent'a sadece burada veri gönderilir
  const handleLocalSubmit = useCallback(() => {
    onSubmit(localFormData);
  }, [localFormData, onSubmit]);

  // Hook'lar bittikten SONRA conditional return
  if (!open) return null;

  const isSalesInvoice = localFormData.module === 'INVOICE_SALES';
  const previewCode = localFormData.prefix && localFormData.digitCount > 0
    ? buildPreviewCode(localFormData)
    : '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          bgcolor: 'var(--card)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          m: 0,
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 75%, #000) 100%)',
          color: 'var(--primary-foreground)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tag />
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
              {editingTemplate ? 'Şablon Düzenle' : 'Yeni Şablon Ekle'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Otomatik numara üretim kurallarını tanımlayın
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: 'var(--background)' }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 'var(--radius-md)' }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                1. Modül
              </Typography>
              <FormControl fullWidth disabled={!!editingTemplate} size="small">
                <InputLabel>Modül seçin</InputLabel>
                <Select
                  value={localFormData.module}
                  label="Modül seçin"
                  onChange={(e) => handleLocalChange('module', e.target.value)}
                >
                  {moduleGroups.map((group) => (
                    <React.Fragment key={group}>
                      <ListSubheader sx={{ fontWeight: 700, lineHeight: '32px' }}>
                        {group}
                      </ListSubheader>
                      {moduleOptions
                        .filter((o) => o.group === group)
                        .map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                    </React.Fragment>
                  ))}
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                2. Kod formatı
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Şablon adı"
                    value={localFormData.name}
                    onChange={(e) => handleLocalChange('name', e.target.value)}
                    placeholder="Örn: Satış Faturası No"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Ön ek"
                    value={localFormData.prefix}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      const maxLength = isSalesInvoice && localFormData.includeYear ? 3 : 8;
                      handleLocalChange('prefix', value.slice(0, maxLength));
                    }}
                    inputProps={{ maxLength: isSalesInvoice && localFormData.includeYear ? 3 : 8 }}
                    helperText={isSalesInvoice && localFormData.includeYear ? 'Satış faturası: en fazla 3 karakter' : undefined}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Hane sayısı"
                    value={localFormData.digitCount}
                    onChange={(e) => handleLocalChange('digitCount', parseInt(e.target.value, 10) || 1)}
                    inputProps={{ min: 1, max: 12 }}
                    disabled={isSalesInvoice && localFormData.includeYear}
                    helperText={isSalesInvoice && localFormData.includeYear ? 'Yıl dahil formatta 9 hane kullanılır' : undefined}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localFormData.includeYear || false}
                        onChange={(e) => {
                          const includeYear = e.target.checked;
                          setLocalFormData((prev) => {
                            const next = { ...prev, includeYear };
                            if (prev.module === 'INVOICE_SALES' && includeYear) {
                              next.digitCount = 9;
                              next.prefix = prev.prefix.slice(0, 3);
                            }
                            return next;
                          });
                        }}
                      />
                    }
                    label="Yıl bilgisi ekle (ÖnEk + Yıl + Sıra)"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 'var(--radius-md)', height: '100%' }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                3. Sayaç ve durum
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Başlangıç değeri (sayaç)"
                value={localFormData.currentValue}
                onChange={(e) => handleLocalChange('currentValue', parseInt(e.target.value, 10) || 0)}
                inputProps={{ min: 0 }}
                helperText="Bir sonraki üretilecek kod = başlangıç + 1"
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={localFormData.isActive}
                    onChange={(e) => handleLocalChange('isActive', e.target.checked)}
                  />
                }
                label="Şablon aktif"
              />

              {previewCode && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 'var(--radius-md)',
                    bgcolor: 'color-mix(in srgb, var(--chart-2) 12%, transparent)',
                    border: '1px dashed color-mix(in srgb, var(--chart-2) 40%, transparent)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Sonraki kod önizlemesi
                  </Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                    {previewCode}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600 }}>
          İptal
        </Button>
        <Button
          onClick={handleLocalSubmit}
          variant="contained"
          disabled={!localFormData.module || !localFormData.name || !localFormData.prefix}
          sx={{ textTransform: 'none', fontWeight: 700, minWidth: 120 }}
        >
          {editingTemplate ? 'Güncelle' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

TemplateFormDialog.displayName = 'TemplateFormDialog';

// Reset Counter Dialog Component - Local State ile Ping Sorunu Çözümü
interface ResetCounterDialogProps {
  open: boolean;
  template: CodeTemplate | null;
  initialResetValue: number;
  onClose: () => void;
  onSubmit: (value: number) => void;
}

const ResetCounterDialog = memo(({
  open,
  template,
  initialResetValue,
  onClose,
  onSubmit,
}: ResetCounterDialogProps) => {
  // Local State - Parent'ı etkilemez
  const [localResetValue, setLocalResetValue] = useState(initialResetValue);

  // initialResetValue değiştiğinde local state'i güncelle
  useEffect(() => {
    setLocalResetValue(initialResetValue);
  }, [initialResetValue]);

  // Local submit
  const handleLocalSubmit = useCallback(() => {
    onSubmit(localResetValue);
  }, [localResetValue, onSubmit]);

  // Hook'lar bittikten SONRA conditional return
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle component="div">Sayaç Sıfırla</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {template?.name} için sayacı sıfırlamak üzeresiniz.
              Bu işlem geri alınamaz!
            </Typography>
          </Alert>
          <TextField
            fullWidth
            type="number"
            label="Yeni Değer"
            value={localResetValue}
            onChange={(e) => setLocalResetValue(parseInt(e.target.value) || 0)}
            inputProps={{ min: 0 }}
            helperText="Sayacı sıfırlamak için 0 girin"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button
          onClick={handleLocalSubmit}
          variant="contained"
          color="warning"
        >
          Sıfırla
        </Button>
      </DialogActions>
    </Dialog>
  );
});

ResetCounterDialog.displayName = 'ResetCounterDialog';

export default function NumaraSablonlariPage() {
  const [templates, setTemplates] = useState<CodeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CodeTemplate | null>(null);
  const [resetTemplate, setResetTemplate] = useState<CodeTemplate | null>(null);

  // Initial form data - sadece dialog açıldığında kullanılır
  const [initialFormData, setInitialFormData] = useState({
    module: '',
    name: '',
    prefix: '',
    digitCount: 3,
    currentValue: 0,
    includeYear: false,
    isActive: true,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Snackbar handler - önce tanımla
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // useCallback ile optimize edilmiş fetch
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      try {
        const seedRes = await axios.post('/code-template/seed-defaults');
        const created: string[] = seedRes.data?.created || [];
        if (created.length > 0) {
          showSnackbar(
            `${created.length} eksik modül şablonu oluşturuldu`,
            'success',
          );
        }
      } catch {
        // seed hatası listeyi engellemesin
      }
      const response = await axios.get('/code-template');
      setTemplates(response.data);
    } catch (error: any) {
      showSnackbar('Şablonlar yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  // useEffect - fetchTemplates tanımlandıktan sonra
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Dialog açma - initialFormData hazırla
  const handleOpenDialog = useCallback((template?: CodeTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setInitialFormData({
        module: template.module,
        name: template.name,
        prefix: template.prefix,
        digitCount: template.digitCount,
        currentValue: template.currentValue,
        includeYear: template.includeYear || false,
        isActive: template.isActive,
      });
    } else {
      setEditingTemplate(null);
      setInitialFormData({
        module: '',
        name: '',
        prefix: '',
        digitCount: 3,
        currentValue: 0,
        includeYear: false,
        isActive: true,
      });
    }
    setDialogOpen(true);
  }, []);

  // Dialog kapatma
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingTemplate(null);
  }, []);

  // Submit handler - useCallback ile optimize edilmiş
  const handleSubmit = useCallback(async (submitFormData: {
    module: string;
    name: string;
    prefix: string;
    digitCount: number;
    currentValue: number;
    includeYear: boolean;
    isActive: boolean;
  }) => {
    try {
      if (editingTemplate) {
        // Update - module alanını gönderme
        const { module, ...updateData } = submitFormData;
        await axios.patch(`/code-template/${editingTemplate.id}`, updateData);
        showSnackbar('Şablon güncellendi', 'success');
      } else {
        // Create
        await axios.post('/code-template', submitFormData);
        showSnackbar('Şablon eklendi', 'success');
      }
      handleCloseDialog();
      fetchTemplates();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'İşlem başarısız', 'error');
    }
  }, [editingTemplate, handleCloseDialog, fetchTemplates, showSnackbar]);

  // Delete handler
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Bu şablonu silmek istediğinize emin misiniz?')) return;

    try {
      await axios.delete(`/code-template/${id}`);
      showSnackbar('Şablon silindi', 'success');
      fetchTemplates();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Silme işlemi başarısız', 'error');
    }
  }, [fetchTemplates, showSnackbar]);

  // Reset dialog açma
  const handleOpenResetDialog = useCallback((template: CodeTemplate) => {
    setResetTemplate(template);
    setResetDialogOpen(true);
  }, []);

  // Reset counter handler - useCallback ile optimize edilmiş
  const handleResetCounter = useCallback(async (newValue: number) => {
    if (!resetTemplate) return;

    try {
      await axios.post(`/code-template/reset-counter/${resetTemplate.module}`, {
        newValue: newValue,
      });
      showSnackbar('Sayaç sıfırlandı', 'success');
      setResetDialogOpen(false);
      setResetTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'İşlem başarısız', 'error');
    }
  }, [resetTemplate, fetchTemplates, showSnackbar]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Preview code generator - memoized
  const getPreviewCode = useCallback((template: CodeTemplate) => {
    const nextValue = template.currentValue + 1;
    const paddedNumber = String(nextValue).padStart(template.digitCount, '0');
    if (template.includeYear) {
      const currentYear = new Date().getFullYear();
      return `${template.prefix}${currentYear}${paddedNumber}`;
    }
    return `${template.prefix}${paddedNumber}`;
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Şablon Adı',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'module',
      headerName: 'Modül',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const option = moduleOptions.find((opt) => opt.value === params.value);
        return <Chip label={option?.label || params.value} size="small" color="primary" variant="outlined" />;
      },
    },
    {
      field: 'prefix',
      headerName: 'Ön Ek',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} size="small" color="secondary" />
      ),
    },
    {
      field: 'digitCount',
      headerName: 'Hane',
      width: 80,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'currentValue',
      headerName: 'Mevcut Değer',
      width: 120,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'includeYear',
      headerName: 'Yıl Dahil',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Evet' : 'Hayır'}
          size="small"
          color={params.value ? 'info' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'preview',
      headerName: 'Sonraki Kod',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getPreviewCode(params.row)}
          size="small"
          color="success"
          variant="outlined"
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Durum',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Aktif' : 'Pasif'}
          size="small"
          color={params.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Düzenle">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenDialog(params.row)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sayaç Sıfırla">
            <IconButton
              size="small"
              color="warning"
              onClick={() => handleOpenResetDialog(params.row)}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sil">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings color="primary" />
              Numara Şablonları
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Otomatik kod oluşturma şablonlarını yönetin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Yeni Şablon Ekle
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }} icon={<Info />}>
          <Typography variant="body2">
            <strong>Kullanım:</strong> Her modül için bir kod şablonu tanımlayabilirsiniz.
            Yeni kayıt oluştururken kod alanı boş bırakılırsa, otomatik olarak bu şablonlara göre kod üretilir.
            <br />
            <strong>Örnek:</strong> Depo için "D" ön eki ve 3 hane → D001, D002, D003...
            <br />
            <strong>Yıl Dahil Format:</strong> Satış faturaları için "AZM" ön eki, yıl ve 9 hane → AZM2025000000001, AZM2025000000002...
          </Typography>
        </Alert>

        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={templates}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
          />
        </Paper>

        {/* Create/Edit Dialog - Local State ile Ping Sorunu Çözüldü */}
        <TemplateFormDialog
          open={dialogOpen}
          initialFormData={initialFormData}
          editingTemplate={editingTemplate}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
        />

        {/* Reset Counter Dialog - Local State ile Ping Sorunu Çözüldü */}
        <ResetCounterDialog
          open={resetDialogOpen}
          template={resetTemplate}
          initialResetValue={0}
          onClose={() => setResetDialogOpen(false)}
          onSubmit={handleResetCounter}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}

