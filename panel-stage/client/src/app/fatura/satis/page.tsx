'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Chip,
    TextField,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    CircularProgress,
    Select,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Divider,
    Tooltip,
    ListItemIcon,
    Collapse,
    InputAdornment,
} from '@mui/material';
import {
    Add,
    Visibility,
    Edit,
    Delete,
    Close,
    Cancel,
    Print,
    Undo,
    MoreVert,
    Search,
    Refresh,
    TrendingUp,
    TrendingDown,
    FileDownload,
    ExpandLess,
    ExpandMore,
    CalendarToday,
    Today,
    DateRange,
    FilterList
} from '@mui/icons-material';
import { GridColDef, GridPaginationModel, GridSortModel, GridFilterModel, DataGrid } from '@mui/x-data-grid';
import { trTR } from '@mui/x-data-grid/locales';
import axios from '@/lib/axios';
import MainLayout from '@/components/Layout/MainLayout';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTabStore } from '@/stores/tabStore';

interface Cari {
    id: string;
    cariKodu: string;
    unvan: string;
    tip: string;
    vergiNo?: string;
    tcKimlikNo?: string;
}

interface Stok {
    id: string;
    stokKodu: string;
    stokAdi: string;
    satisFiyati: number;
    kdvOrani: number;
}

interface FaturaKalemi {
    stokId: string;
    stok?: Stok;
    miktar: number;
    birimFiyat: number;
    kdvOrani: number;
    iskontoOrani?: number;
    iskontoTutari?: number;
    tutar?: number;
    kdvTutar?: number;
}

interface Fatura {
    id: string;
    faturaNo: string;
    faturaTipi: 'SATIS' | 'ALIS';
    tarih: string;
    vade: string | null;
    cari: Cari;
    toplamTutar: number;
    kdvTutar: number;
    genelToplam: number;
    durum: 'ACIK' | 'ONAYLANDI' | 'KISMEN_ODENDI' | 'KAPALI' | 'IPTAL';
    iskonto?: number;
    aciklama?: string;
    kalemler?: FaturaKalemi[];
    odenenTutar?: number;
    odenecekTutar?: number;
    createdByUser?: {
        fullName?: string;
        username?: string;
    };
    createdAt?: string;
    updatedByUser?: {
        fullName?: string;
        username?: string;
    };
    updatedAt?: string;
    logs?: Array<{
        createdAt: string;
        message: string;
    }>;
    satisIrsaliyesi?: {
        id: string;
        irsaliyeNo: string;
    };
}

interface SalesStats {
    aylikSatis: { tutar: number; adet: number };
    tahsilatBekleyen: { tutar: number; adet: number };
    vadesiGecmis: { tutar: number; adet: number };
}

export default function SatisFaturalariPage() {
    const { addTab, setActiveTab } = useTabStore();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [faturalar, setFaturalar] = useState<Fatura[]>([]);
    const [cariler, setCariler] = useState<Cari[]>([]);
    const [stoklar, setStoklar] = useState<Stok[]>([]);
    const [loading, setLoading] = useState(false);
    const [showChart, setShowChart] = useState(false);

    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 25,
    });
    const [sortModel, setSortModel] = useState<GridSortModel>([
        { field: 'createdAt', sort: 'desc' },
    ]);
    const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
    const [rowCount, setRowCount] = useState(0);
    const [stats, setStats] = useState<SalesStats | null>(null);
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterDurum, setFilterDurum] = useState<string[]>([]);
    const [showDateChips, setShowDateChips] = useState(true);

    // Dialog states
    const [openAdd, setOpenAdd] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openIptal, setOpenIptal] = useState(false);
    const [openDurumOnay, setOpenDurumOnay] = useState(false);
    const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null);
    const [pendingDurum, setPendingDurum] = useState<{ faturaId: string; eskiDurum: string; yeniDurum: string } | null>(null);
    const [faturaDurumlari, setFaturaDurumlari] = useState<Record<string, string>>({});
    const [irsaliyeIptal, setIrsaliyeIptal] = useState(false);

    // Açılır menü state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuFaturaId, setMenuFaturaId] = useState<string | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        faturaNo: '',
        faturaTipi: 'SATIS' as 'SATIS' | 'ALIS',
        cariId: '',
        tarih: new Date().toISOString().split('T')[0],
        vade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        iskonto: 0,
        aciklama: '',
        kalemler: [] as FaturaKalemi[],
    });

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });

    useEffect(() => {
        fetchFaturalar();
        fetchCariler();
        fetchStoklar();
        fetchStats();
    }, [paginationModel, sortModel, filterModel, searchTerm, filterStartDate, filterEndDate, filterDurum]);

    const fetchFaturalar = async () => {
        try {
            setLoading(true);
            const params: Record<string, any> = {
                faturaTipi: 'SATIS',
                search: searchTerm,
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                sortBy: sortModel[0]?.field || 'createdAt',
                sortOrder: sortModel[0]?.sort || 'desc',
            };
            if (filterStartDate) params.startDate = filterStartDate;
            if (filterEndDate) params.endDate = filterEndDate;
            if (filterDurum.length > 0) params.durum = filterDurum.join(',');

            const response = await axios.get('/fatura', { params });
            const faturaData = response.data?.data || [];
            const totalCount = response.data?.meta?.total ?? response.data?.total ?? faturaData.length;
            setFaturalar(faturaData);
            setRowCount(totalCount);
            const durumMap: Record<string, string> = {};
            faturaData.forEach((fatura: Fatura) => {
                durumMap[fatura.id] = fatura.durum;
            });
            setFaturaDurumlari(durumMap);
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Faturalar yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get('/fatura/stats', {
                params: { faturaTipi: 'SATIS' },
            });
            setStats(response.data);
        } catch (error) {
            console.error('İstatistikler yüklenirken hata:', error);
        }
    };

    const fetchCariler = async () => {
        try {
            const response = await axios.get('/cari', {
                params: { limit: 1000 },
            });
            setCariler(response.data.data || []);
        } catch (error) {
            console.error('Cariler yüklenirken hata:', error);
        }
    };

    const fetchStoklar = async () => {
        try {
            const response = await axios.get('/stok', {
                params: { limit: 1000 },
            });
            setStoklar(response.data.data || []);
        } catch (error) {
            console.error('Stoklar yüklenirken hata:', error);
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleClearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterDurum([]);
        setSearchTerm('');
        setShowDateChips(true);
    };

    const handleQuickDateFilter = (range: 'today' | 'week' | 'month') => {
        const now = new Date();
        let start: Date;

        switch (range) {
            case 'today':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                const dayOfWeek = now.getDay();
                const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                start = new Date(now.setDate(diff));
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        setFilterStartDate(start.toISOString().split('T')[0]);
        setFilterEndDate(now.toISOString().split('T')[0]);
        setShowDateChips(false);
    };

    const handleExportExcel = async () => {
        try {
            const params: Record<string, string> = { faturaTipi: 'SATIS' };
            if (searchTerm) params.search = searchTerm;
            if (filterStartDate) params.startDate = filterStartDate;
            if (filterEndDate) params.endDate = filterEndDate;
            if (filterDurum.length > 0) params.durum = filterDurum.join(',');

            const response = await axios.get('/fatura/export/excel', {
                params,
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `satis_faturalari_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showSnackbar('Excel dosyası indirildi', 'success');
        } catch (error: any) {
            showSnackbar('Excel aktarımı başarısız', 'error');
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, faturaId: string) => {
        setAnchorEl(event.currentTarget);
        setMenuFaturaId(faturaId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuFaturaId(null);
    };

    const resetForm = () => {
        setFormData({
            faturaNo: '',
            faturaTipi: 'SATIS',
            cariId: '',
            tarih: new Date().toISOString().split('T')[0],
            vade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            iskonto: 0,
            aciklama: '',
            kalemler: [],
        });
    };

    const handleAddKalem = () => {
        setFormData(prev => ({
            ...prev,
            kalemler: [...prev.kalemler, { stokId: '', miktar: 1, birimFiyat: 0, kdvOrani: 20, iskontoOrani: 0, iskontoTutari: 0 }],
        }));
    };

    const handleRemoveKalem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            kalemler: prev.kalemler.filter((_, i) => i !== index),
        }));
    };

    const handleKalemChange = (index: number, field: keyof FaturaKalemi, value: any) => {
        setFormData(prev => {
            const newKalemler = [...prev.kalemler];
            newKalemler[index] = { ...newKalemler[index], [field]: value };

            if (field === 'stokId') {
                const stok = stoklar.find(s => s.id === value);
                if (stok) {
                    newKalemler[index].birimFiyat = stok.satisFiyati;
                    newKalemler[index].kdvOrani = stok.kdvOrani;
                }
            }

            return { ...prev, kalemler: newKalemler };
        });
    };

    const calculateTotal = () => {
        let toplamTutar = 0;
        let kdvTutar = 0;

        formData.kalemler.forEach(kalem => {
            const miktar = kalem.miktar || 0;
            const birimFiyat = kalem.birimFiyat || 0;
            const rawTutar = miktar * birimFiyat;
            const iskontoOrani = kalem.iskontoOrani || 0;
            const iskontoTutari = kalem.iskontoTutari ?? (rawTutar * iskontoOrani) / 100;
            const tutar = rawTutar - iskontoTutari;
            const kalemKdv = (tutar * (kalem.kdvOrani || 0)) / 100;
            toplamTutar += tutar;
            kdvTutar += kalemKdv;
        });

        toplamTutar -= formData.iskonto || 0;
        const genelToplam = toplamTutar + kdvTutar;

        return { toplamTutar, kdvTutar, genelToplam };
    };

    const handleSave = async () => {
        try {
            if (!formData.cariId) {
                showSnackbar('Cari seçimi zorunludur', 'error');
                return;
            }

            if (formData.kalemler.length === 0) {
                showSnackbar('En az bir kalem eklemelisiniz', 'error');
                return;
            }

            if (selectedFatura) {
                await axios.put(`/fatura/${selectedFatura.id}`, formData);
                showSnackbar('Fatura başarıyla güncellendi', 'success');
            } else {
                await axios.post('/fatura', formData);
                showSnackbar('Fatura başarıyla oluşturuldu', 'success');
                setOpenAdd(false);
            }

            fetchFaturalar();
            resetForm();
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'İşlem sırasında hata oluştu', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            if (selectedFatura) {
                await axios.delete(`/fatura/${selectedFatura.id}`);
                showSnackbar('Fatura başarıyla silindi', 'success');
                setOpenDelete(false);
                fetchFaturalar();
            }
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Silme işlemi başarısız', 'error');
        }
    };

    const openAddDialog = () => {
        resetForm();
        const lastFatura = faturalar[0];
        const lastNo = lastFatura ? parseInt(lastFatura.faturaNo.split('-')[2]) : 0;
        const newNo = (lastNo + 1).toString().padStart(3, '0');
        setFormData(prev => ({
            ...prev,
            faturaNo: `SF-${new Date().getFullYear()}-${newNo}`,
        }));
        setOpenAdd(true);
    };

    const openViewDialog = async (fatura: Fatura) => {
        try {
            const response = await axios.get(`/fatura/${fatura.id}`);
            setSelectedFatura(response.data);
            setOpenView(true);
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Fatura yüklenirken hata oluştu', 'error');
        }
    };

    const openDeleteDialog = (fatura: Fatura) => {
        setSelectedFatura(fatura);
        setOpenDelete(true);
    };

    const openIptalDialog = (fatura: Fatura) => {
        setSelectedFatura(fatura);
        setOpenIptal(true);
    };

    const handleIptal = async () => {
        try {
            if (selectedFatura) {
                await axios.put(`/fatura/${selectedFatura.id}/iptal`, {
                    irsaliyeIptal: irsaliyeIptal,
                });
                const mesaj = irsaliyeIptal
                    ? 'Fatura ve bağlı irsaliye başarıyla iptal edildi. Stoklar ve cari bakiye güncellendi.'
                    : 'Fatura başarıyla iptal edildi. Stoklar ve cari bakiye güncellendi.';
                showSnackbar(mesaj, 'success');
                setOpenIptal(false);
                setIrsaliyeIptal(false);
                fetchFaturalar();
            }
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'İptal işlemi başarısız', 'error');
        }
    };

    const handleDurumChangeRequest = (faturaId: string, eskiDurum: string, yeniDurum: string) => {
        if (eskiDurum === yeniDurum) {
            return;
        }

        const fatura = faturalar.find(f => f.id === faturaId);
        if (!fatura) {
            return;
        }

        setFaturaDurumlari(prev => ({ ...prev, [faturaId]: yeniDurum }));
        setSelectedFatura(fatura);
        setPendingDurum({ faturaId, eskiDurum, yeniDurum });
        setOpenDurumOnay(true);
    };

    const handleDurumChangeConfirm = async () => {
        if (!pendingDurum) {
            return;
        }

        try {
            await axios.put(`/fatura/${pendingDurum.faturaId}/durum`, { durum: pendingDurum.yeniDurum });

            let mesaj = 'Fatura durumu güncellendi';
            if (pendingDurum.yeniDurum === 'ONAYLANDI') {
                mesaj = 'Fatura onaylandı. Stoklar azaldı ve cari bakiye güncellendi.';
            } else if (pendingDurum.yeniDurum === 'IPTAL') {
                mesaj = 'Fatura iptal edildi. Cari bakiye düzeltildi.';
            } else if (pendingDurum.yeniDurum === 'ACIK') {
                mesaj = 'Fatura beklemeye alındı. Stok ve cari işlemleri geri alındı.';
            }

            showSnackbar(mesaj, 'success');
            setOpenDurumOnay(false);
            setPendingDurum(null);
            fetchFaturalar();
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Durum değiştirme başarısız', 'error');
            setOpenDurumOnay(false);
            setPendingDurum(null);
            fetchFaturalar();
        }
    };

    const handleDurumChangeCancel = () => {
        if (pendingDurum) {
            setFaturaDurumlari(prev => ({ ...prev, [pendingDurum.faturaId]: pendingDurum.eskiDurum }));
        }
        setOpenDurumOnay(false);
        setPendingDurum(null);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    };

    const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
        switch (status) {
            case 'KAPALI':
                return 'success';
            case 'ONAYLANDI':
                return 'default';
            case 'ACIK':
                return 'warning';
            case 'KISMEN_ODENDI':
                return 'default';
            case 'IPTAL':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'KAPALI':
                return 'Ödendi';
            case 'ONAYLANDI':
                return 'Onaylandı';
            case 'ACIK':
                return 'Beklemede';
            case 'KISMEN_ODENDI':
                return 'Kısmen Ödendi';
            case 'IPTAL':
                return 'İptal Edildi';
            default:
                return status;
        }
    };

    const handleEdit = (row: Fatura) => {
        const tabId = `fatura-satis-duzenle-${row.id}`;
        addTab({ id: tabId, label: `Düzenle: ${row.faturaNo}`, path: `/fatura/satis/duzenle/${row.id}` });
        setActiveTab(tabId);
        router.push(`/fatura/satis/duzenle/${row.id}`);
    };

    const handleView = (row: Fatura) => {
        openViewDialog(row);
    };

    const columns: GridColDef[] = useMemo(() => [
        {
            field: 'faturaNo',
            headerName: 'Fatura No',
            flex: 1,
            minWidth: 140,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight="700" sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
            ),
        },
        {
            field: 'tarih',
            headerName: 'Tarih',
            width: 110,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-'}
                </Typography>
            ),
        },
        {
            field: 'cari',
            headerName: 'Cari',
            flex: 1.5,
            minWidth: 180,
            renderCell: (params) => (
                <Box>
                    <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.875rem', color: '#1e293b' }}>
                        {params.row.cari?.unvan || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {params.row.cari?.vergiNo || params.row.cari?.tcKimlikNo || ''}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'vade',
            headerName: 'Vade',
            width: 110,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-'}
                </Typography>
            ),
        },
        {
            field: 'genelToplam',
            headerName: 'Tutar',
            width: 140,
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                    <TrendingUp fontSize="small" sx={{ mr: 0.5, color: '#16a34a', fontSize: '0.75rem' }} />
                    <Typography variant="body2" fontWeight="700" sx={{ fontSize: '0.875rem', color: '#16a34a' }}>
                        {formatCurrency(params.value ?? 0)}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'durum',
            headerName: 'Durum',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={getStatusLabel(params.value)}
                    size="small"
                    sx={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        bgcolor: params.value === 'KAPALI' ? 'rgba(22, 163, 74, 0.1)' :
                            params.value === 'ONAYLANDI' ? 'rgba(59, 130, 246, 0.1)' :
                                params.value === 'ACIK' ? 'rgba(249, 115, 22, 0.1)' :
                                    params.value === 'IPTAL' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        color: params.value === 'KAPALI' ? '#16a34a' :
                            params.value === 'ONAYLANDI' ? '#3b82f6' :
                                params.value === 'ACIK' ? '#f97316' :
                                    params.value === 'IPTAL' ? '#ef4444' : '#64748b',
                        border: params.value === 'KAPALI' ? '1px solid rgba(22, 163, 74, 0.3)' :
                            params.value === 'ONAYLANDI' ? '1px solid rgba(59, 130, 246, 0.3)' :
                                params.value === 'ACIK' ? '1px solid rgba(249, 115, 22, 0.3)' :
                                    params.value === 'IPTAL' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(100, 116, 139, 0.3)',
                        borderRadius: '4px',
                    }}
                />
            ),
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'İşlemler',
            width: 140,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', width: '100%' }}>
                    <Tooltip title="Düzenle">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(params.row); }}>
                            <Edit fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Yazdır">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); window.open(`/fatura/satis/print/${params.row.id}`, '_blank'); }}>
                            <Print fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Detay">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleView(params.row); }}>
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Diğer">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e as any, params.row.id); }}>
                            <MoreVert fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ], []);

    const renderFormDialog = () => {
        const { toplamTutar, kdvTutar, genelToplam } = calculateTotal();

        return (
            <Dialog
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle component="div">
                    <Typography variant="h6" fontWeight="bold">
                        {openAdd ? 'Yeni Satış Faturası' : 'Satış Faturası Düzenle'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {openAdd ? 'Müşteriye yeni fatura oluşturun' : 'Fatura bilgilerini güncelleyin'}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                sx={{ flex: 1 }}
                                label="Fatura No"
                                value={formData.faturaNo}
                                onChange={(e) => setFormData(prev => ({ ...prev, faturaNo: e.target.value }))}
                                required
                                size="small"
                            />
                            <TextField
                                sx={{ flex: 1 }}
                                type="date"
                                label="Tarih"
                                value={formData.tarih}
                                onChange={(e) => setFormData(prev => ({ ...prev, tarih: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                required
                                size="small"
                            />
                            <TextField
                                sx={{ flex: 1 }}
                                type="date"
                                label="Vade"
                                value={formData.vade}
                                onChange={(e) => setFormData(prev => ({ ...prev, vade: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                            />
                        </Box>
                        <Box>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Cari</InputLabel>
                                <Select
                                    value={formData.cariId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, cariId: e.target.value }))}
                                    label="Cari"
                                >
                                    {cariler.map((cari) => (
                                        <MenuItem key={cari.id} value={cari.id}>
                                            {cari.cariKodu} - {cari.unvan}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>Fatura Kalemleri</Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleAddKalem}
                                    sx={{
                                        bgcolor: '#3b82f6',
                                        '&:hover': { bgcolor: '#2563eb' },
                                        boxShadow: 'none',
                                        borderRadius: 2,
                                    }}
                                >
                                    + Kalem Ekle
                                </Button>
                            </Box>

                            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1, overflow: 'hidden' }}>
                                <Box sx={{
                                    bgcolor: '#f8fafc',
                                    display: 'grid',
                                    gridTemplateColumns: '30% 10% 12% 10% 12% 10% 11% 5%',
                                    px: 2,
                                    py: 1,
                                    borderBottom: '1px solid #e2e8f0'
                                }}>
                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569' }}>Stok</Typography>
                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569' }}>Miktar</Typography>
                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569' }}>Birim Fiyat</Typography>
                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569' }}>İsk (%)</Typography>
                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569' }}>İsk (₺)</Typography>
                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569' }}>KDV %</Typography>
                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569', textAlign: 'right' }}>Satır Toplamı</Typography>
                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569', textAlign: 'center' }}>İşlem</Typography>
                                </Box>
                                {formData.kalemler.length === 0 ? (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">Henüz kalem eklenmedi</Typography>
                                    </Box>
                                ) : (
                                    formData.kalemler.map((kalem, index) => {
                                        const rawTutar = (kalem.miktar || 0) * (kalem.birimFiyat || 0);
                                        const lineIskonto = kalem.iskontoTutari || (rawTutar * (kalem.iskontoOrani || 0)) / 100;
                                        const lineNet = rawTutar - lineIskonto;
                                        const lineKdv = (lineNet * (kalem.kdvOrani || 0)) / 100;
                                        const lineTotal = lineNet + lineKdv;

                                        return (
                                            <Box key={index} sx={{
                                                display: 'grid',
                                                gridTemplateColumns: '30% 10% 12% 10% 12% 10% 11% 5%',
                                                px: 2,
                                                py: 1.5,
                                                borderBottom: '1px solid #f1f5f9',
                                                '&:last-child': { borderBottom: 'none' },
                                                alignItems: 'center'
                                            }}>
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={kalem.stokId}
                                                        onChange={(e) => handleKalemChange(index, 'stokId', e.target.value)}
                                                    >
                                                        {stoklar.map((stok) => (
                                                            <MenuItem key={stok.id} value={stok.id} sx={{ fontSize: '0.875rem' }}>
                                                                {stok.stokKodu} - {stok.stokAdi}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    size="small"
                                                    value={kalem.miktar}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value);
                                                        handleKalemChange(index, 'miktar', isNaN(value) ? 1 : value);
                                                    }}
                                                    inputProps={{ min: 1, style: { fontSize: '0.875rem' } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    size="small"
                                                    value={kalem.birimFiyat}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value);
                                                        handleKalemChange(index, 'birimFiyat', isNaN(value) ? 0 : value);
                                                    }}
                                                    inputProps={{ min: 0, step: 0.01, style: { fontSize: '0.875rem' } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    size="small"
                                                    value={kalem.iskontoOrani}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value);
                                                        handleKalemChange(index, 'iskontoOrani', isNaN(value) ? 0 : value);
                                                    }}
                                                    inputProps={{ min: 0, max: 100, step: 0.1, style: { fontSize: '0.875rem' } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    size="small"
                                                    value={kalem.iskontoTutari}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value);
                                                        handleKalemChange(index, 'iskontoTutari', isNaN(value) ? 0 : value);
                                                    }}
                                                    inputProps={{ min: 0, step: 0.01, style: { fontSize: '0.875rem' } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    size="small"
                                                    value={kalem.kdvOrani}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value, 10);
                                                        handleKalemChange(index, 'kdvOrani', isNaN(value) ? 0 : value);
                                                    }}
                                                    inputProps={{ min: 0, max: 100, style: { fontSize: '0.875rem' } }}
                                                />
                                                <Typography variant="body2" fontWeight="bold" sx={{ textAlign: 'right', fontSize: '0.875rem' }}>
                                                    {formatCurrency(lineTotal)}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleRemoveKalem(index)}
                                                    sx={{ justifySelf: 'center' }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        );
                                    })
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                sx={{ flex: 1 }}
                                type="number"
                                label="İskonto"
                                value={formData.iskonto}
                                onChange={(e) => setFormData(prev => ({ ...prev, iskonto: parseFloat(e.target.value) || 0 }))}
                                inputProps={{ min: 0, step: 0.01 }}
                                size="small"
                            />
                            <TextField
                                sx={{ flex: 1 }}
                                multiline
                                rows={1}
                                label="Açıklama"
                                value={formData.aciklama}
                                onChange={(e) => setFormData(prev => ({ ...prev, aciklama: e.target.value }))}
                                size="small"
                            />
                        </Box>

                        <Box sx={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 1,
                            p: 2,
                            bgcolor: '#f8fafc'
                        }}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Ara Toplam</Typography>
                                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>{formatCurrency(toplamTutar)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>KDV Toplamı</Typography>
                                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>{formatCurrency(kdvTutar)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Genel Toplam</Typography>
                                    <Typography
                                        variant="body2"
                                        fontWeight="bold"
                                        sx={{
                                            fontSize: '0.875rem',
                                            color: '#3b82f6',
                                        }}
                                    >
                                        {formatCurrency(genelToplam)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0' }}>
                    <Button onClick={() => setOpenAdd(false)} size="small">İptal</Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        size="small"
                        sx={{
                            bgcolor: '#3b82f6',
                            '&:hover': { bgcolor: '#2563eb' },
                            boxShadow: 'none',
                            borderRadius: 2,
                        }}
                    >
                        {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                        {openAdd ? 'Oluştur' : 'Güncelle'}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    const toplamTutar = faturalar.reduce((sum, f) => sum + Number(f.genelToplam || 0), 0);

    return (
        <MainLayout>
            {/* Compact Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '8px',
                            bgcolor: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <TrendingUp sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.125rem', color: '#1e293b' }}>
                        Satış Faturaları
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                            addTab({ id: 'fatura-satis-yeni', label: 'Yeni Satış Faturası', path: '/fatura/satis/yeni' });
                            setActiveTab('fatura-satis-yeni');
                            router.push('/fatura/satis/yeni');
                        }}
                        sx={{
                            borderColor: '#3b82f6',
                            color: '#3b82f6',
                            boxShadow: 'none',
                            borderRadius: 2,
                        }}
                    >
                        + Yeni Fatura
                    </Button>
                </Box>
            </Box>

            {/* Metrics Strip */}
            <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0' }}>
                    <Box sx={{ flex: '1 1 120px', px: 3, py: 2, borderRight: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Toplam Fatura
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', mt: 0.5 }}>
                            {faturalar.length}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 120px', px: 3, py: 2, borderRight: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Aylık Satış
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a', mt: 0.5 }}>
                            {formatCurrency(stats?.aylikSatis?.tutar || 0)}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 120px', px: 3, py: 2, borderRight: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Bekleyen Tahsilat
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#f97316', mt: 0.5 }}>
                            {formatCurrency(stats?.tahsilatBekleyen?.tutar || 0)}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 120px', px: 3, py: 2, borderRight: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Vadesi Geçmiş
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', mt: 0.5 }}>
                            {formatCurrency(stats?.vadesiGecmis?.tutar || 0)}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 120px', px: 3, py: 2 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Toplam Tutar
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6', mt: 0.5 }}>
                            {formatCurrency(toplamTutar)}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Integrated Toolbar */}
            <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, p: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Fatura No veya Cari ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: { xs: '100%', md: 350 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: '#94a3b8', fontSize: 18 }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => setSearchTerm('')}
                                        sx={{ color: '#94a3b8' }}
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Hızlı Tarih Çipleri */}
                    {showDateChips && (
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            <Chip
                                label="Bugün"
                                size="small"
                                onClick={() => handleQuickDateFilter('today')}
                                sx={{
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' },
                                }}
                                icon={<Today fontSize="small" sx={{ fontSize: '0.75rem' }} />}
                            />
                            <Chip
                                label="Bu Hafta"
                                size="small"
                                onClick={() => handleQuickDateFilter('week')}
                                sx={{
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' },
                                }}
                                icon={<DateRange fontSize="small" sx={{ fontSize: '0.75rem' }} />}
                            />
                            <Chip
                                label="Bu Ay"
                                size="small"
                                onClick={() => handleQuickDateFilter('month')}
                                sx={{
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' },
                                }}
                                icon={<CalendarToday fontSize="small" sx={{ fontSize: '0.75rem' }} />}
                            />
                        </Box>
                    )}

                    {/* Durum Filtreleri */}
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
                        <FilterList fontSize="small" sx={{ color: '#64748b', fontSize: 16 }} />
                        <Chip
                            label="Beklemede"
                            size="small"
                            clickable
                            onClick={() => {
                                setFilterDurum(prev =>
                                    prev.includes('ACIK')
                                        ? prev.filter(d => d !== 'ACIK')
                                        : [...prev, 'ACIK']
                                );
                            }}
                            sx={{
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                bgcolor: filterDurum.includes('ACIK') ? 'rgba(249, 115, 22, 0.15)' : 'rgba(100, 116, 139, 0.05)',
                                color: filterDurum.includes('ACIK') ? '#f97316' : '#64748b',
                                border: filterDurum.includes('ACIK') ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid rgba(100, 116, 139, 0.2)',
                                cursor: 'pointer',
                            }}
                        />
                        <Chip
                            label="Onaylandı"
                            size="small"
                            clickable
                            onClick={() => {
                                setFilterDurum(prev =>
                                    prev.includes('ONAYLANDI')
                                        ? prev.filter(d => d !== 'ONAYLANDI')
                                        : [...prev, 'ONAYLANDI']
                                );
                            }}
                            sx={{
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                bgcolor: filterDurum.includes('ONAYLANDI') ? 'rgba(59, 130, 246, 0.15)' : 'rgba(100, 116, 139, 0.05)',
                                color: filterDurum.includes('ONAYLANDI') ? '#3b82f6' : '#64748b',
                                border: filterDurum.includes('ONAYLANDI') ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(100, 116, 139, 0.2)',
                                cursor: 'pointer',
                            }}
                        />
                        <Chip
                            label="Kapalı"
                            size="small"
                            clickable
                            onClick={() => {
                                setFilterDurum(prev =>
                                    prev.includes('KAPALI')
                                        ? prev.filter(d => d !== 'KAPALI')
                                        : [...prev, 'KAPALI']
                                );
                            }}
                            sx={{
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                bgcolor: filterDurum.includes('KAPALI') ? 'rgba(22, 163, 74, 0.15)' : 'rgba(100, 116, 139, 0.05)',
                                color: filterDurum.includes('KAPALI') ? '#16a34a' : '#64748b',
                                border: filterDurum.includes('KAPALI') ? '1px solid rgba(22, 163, 74, 0.3)' : '1px solid rgba(100, 116, 139, 0.2)',
                                cursor: 'pointer',
                            }}
                        />
                        <Chip
                            label="İptal"
                            size="small"
                            clickable
                            onClick={() => {
                                setFilterDurum(prev =>
                                    prev.includes('IPTAL')
                                        ? prev.filter(d => d !== 'IPTAL')
                                        : [...prev, 'IPTAL']
                                );
                            }}
                            sx={{
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                bgcolor: filterDurum.includes('IPTAL') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.05)',
                                color: filterDurum.includes('IPTAL') ? '#ef4444' : '#64748b',
                                border: filterDurum.includes('IPTAL') ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(100, 116, 139, 0.2)',
                                cursor: 'pointer',
                            }}
                        />
                    </Box>

                    <Button
                        size="small"
                        variant="text"
                        onClick={handleClearFilters}
                        disabled={!searchTerm && !filterStartDate && !filterEndDate && filterDurum.length === 0}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            color: '#64748b',
                            '&:hover': { bgcolor: 'rgba(100, 116, 139, 0.1)' },
                        }}
                    >
                        Temizle
                    </Button>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Yenile">
                            <IconButton
                                size="small"
                                onClick={() => fetchFaturalar()}
                                sx={{ color: '#64748b', '&:hover': { bgcolor: 'rgba(100, 116, 139, 0.1)' } }}
                            >
                                <Refresh fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={showChart ? 'Grafik Gizle' : 'Grafik Göster'}>
                            <IconButton
                                size="small"
                                onClick={() => setShowChart(!showChart)}
                                sx={{ color: '#64748b', '&:hover': { bgcolor: 'rgba(100, 116, 139, 0.1)' } }}
                            >
                                {showChart ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Paper>

            {/* Summary Info Bar */}
            <Box sx={{
                py: 1,
                px: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
            }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Toplam {rowCount} kayıt gösteriliyor • {formatCurrency(toplamTutar)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Excel İndir">
                        <IconButton
                            size="small"
                            onClick={handleExportExcel}
                            sx={{ color: '#64748b', '&:hover': { bgcolor: 'rgba(100, 116, 139, 0.1)' } }}
                        >
                            <FileDownload fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* DataGrid */}
            <Paper variant="outlined" sx={{
                borderRadius: 0,
                borderTop: 'none',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
                overflow: 'hidden',
            }}>
                <DataGrid
                    rows={faturalar}
                    columns={columns}
                    loading={loading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    sortModel={sortModel}
                    onSortModelChange={setSortModel}
                    filterModel={filterModel}
                    onFilterModelChange={setFilterModel}
                    pageSizeOptions={[25, 50, 100]}
                    checkboxSelection={false}
                    disableRowSelectionOnClick={true}
                    localeText={trTR.components.MuiDataGrid.defaultProps.localeText}
                    sx={{
                        border: 'none',
                        borderRadius: 0,
                        '& .MuiDataGrid-columnHeaders': {
                            bgcolor: '#f8fafc',
                            borderBottom: '2px solid #e2e8f0',
                            '& .MuiDataGrid-columnHeaderTitle': {
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                color: '#475569',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            },
                        },
                        '& .MuiDataGrid-row': {
                            '&:hover': { bgcolor: '#f0fdf4' },
                            '&:nth-of-type(even)': { bgcolor: '#fafafa' },
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: '0.875rem',
                        },
                        '& .MuiDataGrid-footerContainer': {
                            borderTop: '1px solid #e2e8f0',
                            bgcolor: '#f8fafc',
                        },
                    }}
                />
            </Paper>

            {/* Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    elevation: 3,
                    sx: { minWidth: 200, borderRadius: 2 },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {(() => {
                    const fatura = faturalar.find(f => f.id === menuFaturaId);
                    if (!fatura) return null;

                    return [
                        <MenuItem key="detail" onClick={() => { handleMenuClose(); handleView(fatura); }} sx={{ fontSize: '0.875rem' }}>
                            <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
                            Detayları Görüntüle
                        </MenuItem>,
                        <MenuItem key="edit" onClick={() => { handleMenuClose(); handleEdit(fatura); }} sx={{ fontSize: '0.875rem' }}>
                            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                            Düzenle
                        </MenuItem>,
                        <MenuItem key="print" onClick={() => { handleMenuClose(); window.open(`/fatura/satis/print/${fatura.id}`, '_blank'); }} sx={{ fontSize: '0.875rem' }}>
                            <ListItemIcon><Print fontSize="small" /></ListItemIcon>
                            Yazdır
                        </MenuItem>,
                        <Divider key="d1" />,
                        <MenuItem
                            key="return"
                            onClick={() => {
                                const path = `/fatura/iade/satis/yeni?originalId=${fatura.id}`;
                                addTab({ id: 'fatura-iade-satis-yeni', label: 'Yeni Satış İade Faturası', path });
                                setActiveTab('fatura-iade-satis-yeni');
                                router.push(path);
                                handleMenuClose();
                            }}
                            sx={{ fontSize: '0.875rem' }}
                        >
                            <ListItemIcon><Undo fontSize="small" /></ListItemIcon>
                            İade Oluştur
                        </MenuItem>,
                        <MenuItem
                            key="cancel"
                            onClick={() => { handleMenuClose(); openIptalDialog(fatura); }}
                            disabled={fatura.durum !== 'ONAYLANDI'}
                            sx={{ fontSize: '0.875rem', color: '#ef4444' }}
                        >
                            <ListItemIcon><Cancel fontSize="small" color="error" /></ListItemIcon>
                            İptal Et
                        </MenuItem>,
                        <MenuItem
                            key="delete"
                            onClick={() => { handleMenuClose(); openDeleteDialog(fatura); }}
                            disabled={fatura.durum === 'ONAYLANDI' || fatura.durum === 'IPTAL'}
                            sx={{ fontSize: '0.875rem', color: '#ef4444' }}
                        >
                            <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
                            Sil
                        </MenuItem>,
                    ];
                })()}
            </Menu>

            {/* Form Dialog */}
            {renderFormDialog()}

            {/* View Dialog */}
            <Dialog
                open={openView}
                onClose={() => setOpenView(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle component="div">
                    <Typography variant="h6" fontWeight="bold">Fatura Detayı</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Fatura bilgilerini görüntüleyin
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {selectedFatura && (
                        <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Fatura No</Typography>
                                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>{selectedFatura.faturaNo}</Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Tarih</Typography>
                                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>
                                        {formatDate(selectedFatura.tarih)}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Cari</Typography>
                                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>
                                    {selectedFatura.cari.unvan}
                                </Typography>
                            </Box>

                            {selectedFatura.kalemler && selectedFatura.kalemler.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, fontSize: '0.875rem' }}>Kalemler</Typography>
                                    <Box sx={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 1,
                                        overflow: 'hidden'
                                    }}>
                                        <Box sx={{
                                            bgcolor: '#f8fafc',
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(8, 1fr)',
                                            px: 2,
                                            py: 1,
                                            borderBottom: '1px solid #e2e8f0'
                                        }}>
                                            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569' }}>Malzeme Kodu</Typography>
                                            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569' }}>Stok</Typography>
                                            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569' }}>Miktar</Typography>
                                            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569' }}>Birim Fiyat</Typography>
                                            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569' }}>İndirim (%)</Typography>
                                            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569' }}>İndirim (₺)</Typography>
                                            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569' }}>KDV %</Typography>
                                            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem', color: '#475569', textAlign: 'right' }}>Tutar</Typography>
                                        </Box>
                                        {selectedFatura.kalemler.map((kalem, index) => {
                                            const araToplam = kalem.miktar * kalem.birimFiyat;
                                            const iskontoTutar = kalem.iskontoTutari || (araToplam * (kalem.iskontoOrani || 0)) / 100;
                                            const netTutar = araToplam - iskontoTutar;
                                            const kdvTutar = (netTutar * (kalem.kdvOrani || 0)) / 100;
                                            const satirToplami = netTutar + kdvTutar;

                                            return (
                                                <Box key={index} sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(8, 1fr)',
                                                    px: 2,
                                                    py: 1.5,
                                                    borderBottom: '1px solid #f1f5f9',
                                                    '&:last-child': { borderBottom: 'none' },
                                                    '&:hover': { bgcolor: '#f8fafc' }
                                                }}>
                                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{kalem.stok?.stokKodu || '-'}</Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#64748b' }}>{kalem.stok?.stokAdi || '-'}</Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{kalem.miktar}</Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{formatCurrency(kalem.birimFiyat)}</Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>%{kalem.iskontoOrani || 0}</Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{formatCurrency(kalem.iskontoTutari || 0)}</Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>%{kalem.kdvOrani || 0}</Typography>
                                                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.875rem', textAlign: 'right', color: '#16a34a' }}>
                                                        {formatCurrency(satirToplami)}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            )}

                            <Box sx={{
                                border: '1px solid #e2e8f0',
                                borderRadius: 1,
                                p: 2,
                                bgcolor: '#f8fafc',
                                mb: 2
                            }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Ara Toplam</Typography>
                                        <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
                                            {formatCurrency(Number(selectedFatura.toplamTutar || 0) + Number(selectedFatura.iskonto || 0))}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>İskonto</Typography>
                                        <Typography variant="body2" fontWeight={500} color="#ef4444" sx={{ fontSize: '0.875rem' }}>
                                            -{formatCurrency(selectedFatura.iskonto || 0)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>KDV Toplamı</Typography>
                                        <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
                                            {formatCurrency(selectedFatura.kdvTutar || 0)}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ width: '250px', my: 1 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>Genel Toplam</Typography>
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.875rem', color: '#3b82f6' }}>
                                            {formatCurrency(selectedFatura.genelToplam)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Audit Bilgileri */}
                            <Box sx={{
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: 1,
                                p: 2,
                                bgcolor: 'rgba(59, 130, 246, 0.05)'
                            }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#3b82f6', fontSize: '0.875rem' }}>
                                    📋 Denetim Bilgileri
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                Oluşturan
                                            </Typography>
                                            <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.875rem' }}>
                                                {selectedFatura.createdByUser?.fullName || 'Sistem'}
                                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5, fontSize: '0.75rem' }}>
                                                    ({selectedFatura.createdByUser?.username || '-'})
                                                </Typography>
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                Oluşturma Tarihi
                                            </Typography>
                                            <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.875rem' }}>
                                                {selectedFatura.createdAt
                                                    ? new Date(selectedFatura.createdAt).toLocaleString('tr-TR')
                                                    : '-'}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {selectedFatura.updatedByUser && (
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                    Son Güncelleyen
                                                </Typography>
                                                <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.875rem' }}>
                                                    {selectedFatura.updatedByUser.fullName}
                                                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5, fontSize: '0.75rem' }}>
                                                        ({selectedFatura.updatedByUser.username})
                                                    </Typography>
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                    Son Güncelleme
                                                </Typography>
                                                <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.875rem' }}>
                                                    {selectedFatura.updatedAt
                                                        ? new Date(selectedFatura.updatedAt).toLocaleString('tr-TR')
                                                        : '-'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0' }}>
                    <Button onClick={() => setOpenView(false)} size="small">Kapat</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={openDelete} onClose={() => setOpenDelete(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle component="div">
                    <Typography variant="h6" fontWeight="bold">Fatura Sil</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Bu işlem geri alınamaz
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        <strong>{selectedFatura?.faturaNo}</strong> nolu faturayı silmek istediğinizden emin misiniz?
                    </Typography>
                    <Typography variant="body2" color="#ef4444" sx={{ mt: 2, fontSize: '0.875rem', fontWeight: 500 }}>
                        Bu işlem geri alınamaz!
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0' }}>
                    <Button onClick={() => setOpenDelete(false)} size="small">İptal</Button>
                    <Button onClick={handleDelete} variant="contained" color="error" size="small" sx={{ borderRadius: 2, boxShadow: 'none' }}>
                        Sil
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Durum Değişikliği Onay Dialog */}
            <Dialog open={openDurumOnay} onClose={handleDurumChangeCancel} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle component="div" sx={{
                    bgcolor: '#3b82f6',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2,
                    px: 3,
                }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.125rem' }}>Durum Değişikliği Onayı</Typography>
                    <IconButton size="small" onClick={handleDurumChangeCancel} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {pendingDurum && selectedFatura && (
                        <Box>
                            <Alert severity="warning" sx={{ mb: 2, borderRadius: 1 }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>
                                    Bu işlem stok ve cari hareketlerini etkileyecektir!
                                </Typography>
                            </Alert>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', mb: 2 }}>
                                <strong>{selectedFatura.faturaNo}</strong> nolu fatura durumunu değiştirmek istiyorsunuz.
                            </Typography>
                            <Box sx={{
                                p: 2,
                                bgcolor: '#f8fafc',
                                borderRadius: 1,
                                mb: 2,
                                border: '1px solid #e2e8f0'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Mevcut Durum</Typography>
                                        <Chip
                                            label={getStatusLabel(pendingDurum.eskiDurum)}
                                            color={getStatusColor(pendingDurum.eskiDurum)}
                                            size="small"
                                            sx={{ mt: 0.5, fontSize: '0.75rem', borderRadius: '4px' }}
                                        />
                                    </Box>
                                    <Typography variant="h6" color="text.secondary">→</Typography>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Yeni Durum</Typography>
                                        <Chip
                                            label={getStatusLabel(pendingDurum.yeniDurum)}
                                            color={getStatusColor(pendingDurum.yeniDurum)}
                                            size="small"
                                            sx={{ mt: 0.5, fontSize: '0.75rem', borderRadius: '4px' }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                            {pendingDurum.yeniDurum === 'ONAYLANDI' && (
                                <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                        • Stok hareketi oluşturulacak (çıkış)<br />
                                        • Cari bakiye güncellenecek
                                    </Typography>
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0' }}>
                    <Button onClick={handleDurumChangeCancel} size="small">İptal</Button>
                    <Button
                        onClick={handleDurumChangeConfirm}
                        variant="contained"
                        size="small"
                        sx={{
                            bgcolor: '#3b82f6',
                            '&:hover': { bgcolor: '#2563eb' },
                            boxShadow: 'none',
                            borderRadius: 2,
                        }}
                    >
                        Onayla ve Değiştir
                    </Button>
                </DialogActions>
            </Dialog>

            {/* İptal Dialog */}
            <Dialog open={openIptal} onClose={() => { setOpenIptal(false); setIrsaliyeIptal(false); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle component="div" sx={{
                    bgcolor: '#ef4444',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2,
                    px: 3,
                }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.125rem' }}>Fatura İptal</Typography>
                    <IconButton size="small" onClick={() => { setOpenIptal(false); setIrsaliyeIptal(false); }} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {selectedFatura && (
                        <Box>
                            <Alert severity="warning" sx={{ mb: 2, borderRadius: 1 }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>
                                    Bu işlem geri alınamaz! Stoklar ve cari hareketleri etkilenecektir.
                                </Typography>
                            </Alert>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem', mb: 2 }}>
                                <strong>{selectedFatura.faturaNo}</strong> nolu faturayı iptal etmek istediğinizden emin misiniz?
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0' }}>
                    <Button onClick={() => { setOpenIptal(false); setIrsaliyeIptal(false); }} size="small">Vazgeç</Button>
                    <Button
                        onClick={handleIptal}
                        variant="contained"
                        color="error"
                        size="small"
                        sx={{ borderRadius: 2, boxShadow: 'none' }}
                    >
                        İptal Et
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: '100%', borderRadius: 2 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </MainLayout>
    );
}