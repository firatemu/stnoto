import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

// Cache keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  collection: (period: string) => [...dashboardKeys.all, 'collection', period] as const,
  inventory: () => [...dashboardKeys.all, 'inventory'] as const,
  transactions: (limit: number) => [...dashboardKeys.all, 'transactions', limit] as const,
  reminders: (filter: string) => [...dashboardKeys.all, 'reminders', filter] as const,
};

// Dashboard Stats Hook
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      // Try dashboard stats endpoint first, fallback to individual calls
      try {
        const res = await axios.get('/dashboard/stats');
        return res.data;
      } catch (error) {
        // Fallback: Calculate stats from individual endpoints
        const [stokRes, cariRes] = await Promise.allSettled([
          axios.get('/stok', { params: { page: 1, limit: 1 } }),
          axios.get('/cari', { params: { page: 1, limit: 1 } }),
        ]);

        return {
          toplamStok: stokRes.status === 'fulfilled' ? (stokRes.value.data?.meta?.total || 0) : 0,
          cariSayisi: cariRes.status === 'fulfilled' ? (cariRes.value.data?.meta?.total || 0) : 0,
          aylikSatis: 0, // Will be calculated separately
          karMarji: 0,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Monthly Sales Hook (separate for better caching)
export function useMonthlySales() {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'monthly-sales'],
    queryFn: async () => {
      const bugun = new Date();
      const buAyBaslangic = new Date(bugun.getFullYear(), bugun.getMonth(), 1);
      const buAyBitis = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0, 23, 59, 59);

      const res = await axios.get('/fatura', {
        params: {
          page: 1,
          limit: 1000,
          baslangic: buAyBaslangic.toISOString(),
          bitis: buAyBitis.toISOString(),
        },
      });

      const invoices = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const aylikSatis = invoices.reduce((sum: number, f: any) => sum + Number(f.genelToplam || 0), 0);

      return aylikSatis;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - sales don't change often
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Collection Data Hook
export function useCollectionData(period: 'daily' | 'weekly' | 'monthly') {
  return useQuery({
    queryKey: dashboardKeys.collection(period),
    queryFn: async () => {
      const now = new Date();
      let baslangic: Date;
      let bitis: Date;
      let chartData: any[] = [];

      if (period === 'monthly') {
        // Last 6 months
        baslangic = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        bitis = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        
        const res = await axios.get('/tahsilat', {
          params: {
            page: 1,
            limit: 1000,
            baslangic: baslangic.toISOString(),
            bitis: bitis.toISOString(),
          },
        });

        const allTahsilat = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        
        // Group by month
        const ayIsimleri = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const s = new Date(d.getFullYear(), d.getMonth(), 1);
          const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
          
          const mOps = allTahsilat.filter((t: any) => {
            const dt = new Date(t.tarih);
            return dt >= s && dt <= e;
          });

          chartData.push({
            name: ayIsimleri[d.getMonth()],
            tahsilat: mOps.filter((t: any) => t.tip === 'TAHSILAT').reduce((sum: number, t: any) => sum + Number(t.tutar), 0),
            odeme: mOps.filter((t: any) => t.tip === 'ODEME').reduce((sum: number, t: any) => sum + Number(t.tutar), 0),
          });
        }

        // Calculate stats
        const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const pStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const pEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const currentOps = allTahsilat.filter((t: any) => new Date(t.tarih) >= mStart);
        const prevOps = allTahsilat.filter((t: any) => {
          const dt = new Date(t.tarih);
          return dt >= pStart && dt <= pEnd;
        });

        const currentMonthCollection = currentOps.filter((t: any) => t.tip === 'TAHSILAT').reduce((s: number, t: any) => s + Number(t.tutar), 0);
        const currentMonthPayment = currentOps.filter((t: any) => t.tip === 'ODEME').reduce((s: number, t: any) => s + Number(t.tutar), 0);
        const previousMonthCollection = prevOps.filter((t: any) => t.tip === 'TAHSILAT').reduce((s: number, t: any) => s + Number(t.tutar), 0);
        const previousMonthPayment = prevOps.filter((t: any) => t.tip === 'ODEME').reduce((s: number, t: any) => s + Number(t.tutar), 0);

        return {
          chartData,
          stats: {
            currentMonthCollection,
            currentMonthPayment,
            previousMonthCollection,
            previousMonthPayment,
          },
        };

      } else if (period === 'weekly') {
        // Last 7 days
        const wStart = new Date(now);
        wStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
        wStart.setHours(0, 0, 0, 0);
        baslangic = wStart;
        bitis = new Date(now);

        const res = await axios.get('/tahsilat', {
          params: {
            page: 1,
            limit: 1000,
            baslangic: baslangic.toISOString(),
            bitis: bitis.toISOString(),
          },
        });

        const allTahsilat = Array.isArray(res.data) ? res.data : (res.data?.data || []);

        // Group by day
        const gunIsimleri = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const s = new Date(d);
          s.setHours(0, 0, 0, 0);
          const e = new Date(d);
          e.setHours(23, 59, 59, 999);

          const dOps = allTahsilat.filter((t: any) => {
            const dt = new Date(t.tarih);
            return dt >= s && dt <= e;
          });

          chartData.push({
            name: gunIsimleri[d.getDay()],
            tahsilat: dOps.filter((t: any) => t.tip === 'TAHSILAT').reduce((sum: number, t: any) => sum + Number(t.tutar), 0),
            odeme: dOps.filter((t: any) => t.tip === 'ODEME').reduce((sum: number, t: any) => sum + Number(t.tutar), 0),
          });
        }

        // Calculate stats
        const pwStart = new Date(wStart);
        pwStart.setDate(pwStart.getDate() - 7);
        const pwEnd = new Date(wStart);
        pwEnd.setSeconds(-1);

        const currentOps = allTahsilat.filter((t: any) => new Date(t.tarih) >= wStart);
        const prevOps = allTahsilat.filter((t: any) => {
          const dt = new Date(t.tarih);
          return dt >= pwStart && dt <= pwEnd;
        });

        const currentMonthCollection = currentOps.filter((t: any) => t.tip === 'TAHSILAT').reduce((s: number, t: any) => s + Number(t.tutar), 0);
        const currentMonthPayment = currentOps.filter((t: any) => t.tip === 'ODEME').reduce((s: number, t: any) => s + Number(t.tutar), 0);
        const previousMonthCollection = prevOps.filter((t: any) => t.tip === 'TAHSILAT').reduce((s: number, t: any) => s + Number(t.tutar), 0);
        const previousMonthPayment = prevOps.filter((t: any) => t.tip === 'ODEME').reduce((s: number, t: any) => s + Number(t.tutar), 0);

        return {
          chartData,
          stats: {
            currentMonthCollection,
            currentMonthPayment,
            previousMonthCollection,
            previousMonthPayment,
          },
        };

      } else {
        // Daily - Today
        const dStart = new Date();
        dStart.setHours(0, 0, 0, 0);
        baslangic = dStart;
        bitis = new Date();

        const res = await axios.get('/tahsilat', {
          params: {
            page: 1,
            limit: 1000,
            baslangic: baslangic.toISOString(),
            bitis: bitis.toISOString(),
          },
        });

        const allTahsilat = Array.isArray(res.data) ? res.data : (res.data?.data || []);

        // Group by hour (4-hour intervals)
        for (let i = 0; i < 24; i += 4) {
          const s = new Date(dStart);
          s.setHours(i, 0, 0, 0);
          const e = new Date(dStart);
          e.setHours(i + 3, 59, 59, 999);

          const hOps = allTahsilat.filter((t: any) => {
            const dt = new Date(t.tarih);
            return dt >= s && dt <= e;
          });

          chartData.push({
            name: `${i}:00`,
            tahsilat: hOps.filter((t: any) => t.tip === 'TAHSILAT').reduce((sum: number, t: any) => sum + Number(t.tutar), 0),
            odeme: hOps.filter((t: any) => t.tip === 'ODEME').reduce((sum: number, t: any) => sum + Number(t.tutar), 0),
          });
        }

        // Calculate stats
        const pStart = new Date(dStart);
        pStart.setDate(pStart.getDate() - 1);
        const pEnd = new Date(dStart);
        pEnd.setSeconds(-1);

        const currentOps = allTahsilat.filter((t: any) => new Date(t.tarih) >= dStart);
        const prevOps = allTahsilat.filter((t: any) => {
          const dt = new Date(t.tarih);
          return dt >= pStart && dt <= pEnd;
        });

        const currentMonthCollection = currentOps.filter((t: any) => t.tip === 'TAHSILAT').reduce((s: number, t: any) => s + Number(t.tutar), 0);
        const currentMonthPayment = currentOps.filter((t: any) => t.tip === 'ODEME').reduce((s: number, t: any) => s + Number(t.tutar), 0);
        const previousMonthCollection = prevOps.filter((t: any) => t.tip === 'TAHSILAT').reduce((s: number, t: any) => s + Number(t.tutar), 0);
        const previousMonthPayment = prevOps.filter((t: any) => t.tip === 'ODEME').reduce((s: number, t: any) => s + Number(t.tutar), 0);

        return {
          chartData,
          stats: {
            currentMonthCollection,
            currentMonthPayment,
            previousMonthCollection,
            previousMonthPayment,
          },
        };
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - collection data changes frequently
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Inventory Data Hook
export function useInventoryData() {
  return useQuery({
    queryKey: dashboardKeys.inventory(),
    queryFn: async () => {
      const res = await axios.get('/stok', {
        params: {
          page: 1,
          limit: 1000,
        },
      });

      const stocks = Array.isArray(res.data) ? res.data : (res.data?.data || []);

      // Get critical stock (less than 10)
      const criticalStock = stocks
        .filter((s: any) => Number(s.stokMiktari || s.miktar || 0) < 10)
        .slice(0, 5)
        .map((s: any) => ({
          id: s.id,
          name: s.urunAdi || s.stokAdi || 'İsimsiz',
          stock: Number(s.stokMiktari || s.miktar || 0),
          minStock: 10,
          unit: s.birim || 'Adet',
        }));

      return {
        criticalStock,
        categoryDistribution: [
          { name: 'Yedek Parça', value: 45, color: '#0F172A' },
          { name: 'Sarf Malzeme', value: 25, color: '#334155' },
          { name: 'Aksesuar', value: 20, color: '#64748B' },
        ],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Transactions Data Hook
export function useTransactionsData(limit: number = 5) {
  return useQuery({
    queryKey: dashboardKeys.transactions(limit),
    queryFn: async () => {
      const [faturaRes, tahsilatRes] = await Promise.allSettled([
        axios.get('/fatura', { params: { page: 1, limit: 100, sort: '-createdAt' } }),
        axios.get('/tahsilat', { params: { page: 1, limit: 100, sort: '-createdAt' } }),
      ]);

      const invoices = faturaRes.status === 'fulfilled' ? (Array.isArray(faturaRes.value.data) ? faturaRes.value.data : (faturaRes.value.data?.data || [])) : [];
      const payments = tahsilatRes.status === 'fulfilled' ? (Array.isArray(tahsilatRes.value.data) ? tahsilatRes.value.data : (tahsilatRes.value.data?.data || [])) : [];

      return {
        invoices: invoices.slice(0, limit).map((f: any) => ({
          id: f.id,
          unvan: f.cari?.unvan || 'Cari',
          tarih: f.tarih || f.createdAt,
          tutar: f.genelToplam,
        })),
        payments: payments.slice(0, limit).map((t: any) => ({
          id: t.id,
          cariAdi: t.cari?.unvan || 'Kasa/Banka',
          tarih: t.tarih,
          tutar: t.tutar,
          tur: t.tip === 'TAHSILAT' ? 'GIRIS' : 'CIKIS',
        })),
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minute - transactions change frequently
    gcTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Reminders Data Hook
export function useRemindersData(filter: 'bugun' | 'yarin' | 'bu-hafta' = 'bugun') {
  return useQuery({
    queryKey: dashboardKeys.reminders(filter),
    queryFn: async () => {
      let baslangic = new Date();
      let bitis = new Date();
      baslangic.setHours(0, 0, 0, 0);
      bitis.setHours(23, 59, 59, 999);

      if (filter === 'bugun') {
        // Today
      } else if (filter === 'yarin') {
        baslangic.setDate(baslangic.getDate() + 1);
        bitis.setDate(bitis.getDate() + 1);
      } else if (filter === 'bu-hafta') {
        bitis.setDate(bitis.getDate() + 7);
      }

      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const baslangicStr = formatDate(baslangic);
      const bitisStr = formatDate(bitis);

      // Fetch personel payments
      const gun = new Date().getDate();
      const personelRes = await axios.get('/personel', { params: { aktif: true } });
      const personelData = Array.isArray(personelRes.data) ? personelRes.data : (personelRes.data?.data || []);

      let personelOdemeleri: any[] = [];
      if (filter === 'bugun') {
        personelOdemeleri = personelData.filter((p: any) => {
          if (!p.maasGunu) return false;
          return p.maasGunu === gun;
        });
      }

      // Fetch overdue invoices
      const faturaRes = await axios.get('/fatura', { params: { limit: 100 } });
      const faturaData = Array.isArray(faturaRes.data) ? faturaRes.data : (faturaRes.data?.data || []);
      const vadesiGecenFaturalar = faturaData
        .filter((f: any) => f.vade && new Date(f.vade) < new Date() && Number(f.odenecekTutar) > 0)
        .slice(0, 5);

      // Fetch credit cards
      const ccBitis = new Date();
      ccBitis.setDate(ccBitis.getDate() + 15);
      let krediKartiTarihleri: any[] = [];
      try {
        const ccRes = await axios.get('/banka/kredi-karti/yaklasan', {
          params: { baslangic: baslangicStr, bitis: ccBitis.toISOString() },
        });
        krediKartiTarihleri = Array.isArray(ccRes.data) ? ccRes.data : [];
      } catch (error) {
        console.log('Credit cards endpoint error:', error);
      }

      // Fetch installments
      let krediTaksitleri: any[] = [];
      try {
        const krediRes = await axios.get('/banka/taksitler/yaklasan', {
          params: { baslangic: baslangicStr, bitis: bitisStr },
        });
        krediTaksitleri = Array.isArray(krediRes.data) ? krediRes.data : [];
      } catch (error) {
        console.log('Installments endpoint error:', error);
      }

      // Fetch checks
      let cekSenetler: any[] = [];
      try {
        const cekRes = await axios.get('/cek-senet/yaklasan', {
          params: { baslangic: baslangicStr, bitis: bitisStr },
        });
        cekSenetler = Array.isArray(cekRes.data) ? cekRes.data : [];
      } catch (error) {
        console.log('Checks endpoint error:', error);
      }

      return {
        personelOdemeleri,
        vadesiGecenFaturalar,
        krediTaksitleri,
        krediKartiTarihleri,
        cekSenetler,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: false, // Disabled by default, will be enabled when reminders panel opens
  });
}

// Invalidate all dashboard data
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  };
}