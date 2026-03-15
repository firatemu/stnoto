import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

interface FaturaFilters {
  faturaTipi?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  durum?: string[];
}

interface FaturaStats {
  aylikSatis: { tutar: number; adet: number };
  tahsilatBekleyen: { tutar: number; adet: number };
  vadesiGecmis: { tutar: number; adet: number };
}

// Optimized faturalar hook with proper caching
export function useFaturalarOptimized(filters: FaturaFilters = {}) {
  return useQuery({
    queryKey: ['faturalar', filters],
    queryFn: async () => {
      const {
        faturaTipi,
        search,
        page = 1,
        limit = 25,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        startDate,
        endDate,
        durum
      } = filters;

      const params: any = { page, limit, sortBy, sortOrder };
      
      if (faturaTipi) params.faturaTipi = faturaTipi;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (durum && durum.length > 0) params.durum = durum.join(',');
      
      const response = await axios.get('/fatura', { params });
      const faturaData = response.data?.data || [];
      const totalCount = response.data?.meta?.total ?? response.data?.total ?? faturaData.length;
      
      return {
        items: faturaData,
        total: totalCount,
      };
    },
    staleTime: 60 * 1000, // 1 dakika cache
    gcTime: 3 * 60 * 1000, // 3 dakika cache retention
    refetchOnWindowFocus: false,
  });
}

// Fatura stats with longer cache
export function useFaturaStats(faturaTipi: string) {
  return useQuery({
    queryKey: ['fatura-stats', faturaTipi],
    queryFn: async () => {
      const response = await axios.get('/fatura/stats', {
        params: { faturaTipi },
      });
      return response.data as FaturaStats;
    },
    staleTime: 5 * 60 * 1000, // 5 dakika cache - stats değişmez sık
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Single fatura details
export function useFaturaDetay(id: string) {
  return useQuery({
    queryKey: ['fatura', id],
    queryFn: async () => {
      const response = await axios.get(`/fatura/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

// Mutations
export function useCreateFaturaOptimized() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/fatura', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturalar'] });
      queryClient.invalidateQueries({ queryKey: ['fatura-stats'] });
    },
  });
}

export function useUpdateFaturaOptimized() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await axios.put(`/fatura/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['faturalar'] });
      queryClient.invalidateQueries({ queryKey: ['fatura', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['fatura-stats'] });
    },
  });
}

export function useDeleteFaturaOptimized() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/fatura/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturalar'] });
      queryClient.invalidateQueries({ queryKey: ['fatura-stats'] });
    },
  });
}

export function useCancelFaturaOptimized() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, irsaliyeIptal }: { id: string; irsaliyeIptal: boolean }) => {
      const response = await axios.put(`/fatura/${id}/iptal`, { irsaliyeIptal });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturalar'] });
      queryClient.invalidateQueries({ queryKey: ['fatura-stats'] });
    },
  });
}

export function useUpdateFaturaDurumOptimized() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, durum }: { id: string; durum: string }) => {
      const response = await axios.put(`/fatura/${id}/durum`, { durum });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['faturalar'] });
      queryClient.invalidateQueries({ queryKey: ['fatura', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['fatura-stats'] });
    },
  });
}