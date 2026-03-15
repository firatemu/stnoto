import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

interface StokFilters {
  search?: string;
  page?: number;
  limit?: number;
  kategori?: string;
  altKategori?: string;
  marka?: string;
  stokDurumu?: 'all' | 'inStock' | 'outOfStock';
}

// Optimized stok hook with server-side pagination
export function useStoklarOptimized(filters: StokFilters = {}) {
  return useQuery({
    queryKey: ['stoklar', filters],
    queryFn: async () => {
      const { search, page = 1, limit = 50, kategori, altKategori, marka, stokDurumu } = filters;
      const params: any = { page, limit };
      
      if (search) params.search = search;
      if (kategori) params.anaKategori = kategori;
      if (altKategori) params.altKategori = altKategori;
      if (marka) params.marka = marka;
      
      // Server-side filtering for stock status
      if (stokDurumu === 'inStock') params.stokBos = false;
      if (stokDurumu === 'outOfStock') params.stokBos = true;
      
      const response = await axios.get('/stok', { params });
      const data = response.data?.data || response.data;
      return {
        items: Array.isArray(data) ? data : [],
        total: response.data?.meta?.total || response.data?.total || Array.isArray(data) ? data.length : 0,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 dakika cache
    gcTime: 5 * 60 * 1000, // 5 dakika cache retention
    refetchOnWindowFocus: false, // Sadece manuel yenileme
  });
}

// Optimized stok for dropdowns (small limit)
export function useStoklarForDropdown(search?: string) {
  return useQuery({
    queryKey: ['stoklar-dropdown', search],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (search) params.search = search;
      
      const response = await axios.get('/stok', { params });
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 dakika cache - daha uzun cache
    gcTime: 10 * 60 * 1000,
  });
}

// Mutations
export function useCreateStokOptimized() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/stok', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stoklar'] });
    },
  });
}

export function useUpdateStokOptimized() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await axios.patch(`/stok/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stoklar'] });
    },
  });
}

export function useDeleteStokOptimized() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/stok/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stoklar'] });
    },
  });
}

// Prefetch for smooth pagination
export function prefetchStokPage(page: number, filters: StokFilters = {}) {
  const queryClient = useQueryClient();
  
  queryClient.prefetchQuery({
    queryKey: ['stoklar', { ...filters, page }],
    queryFn: async () => {
      const { search, limit = 50, kategori, altKategori, marka, stokDurumu } = filters;
      const params: any = { page, limit };
      
      if (search) params.search = search;
      if (kategori) params.anaKategori = kategori;
      if (altKategori) params.altKategori = altKategori;
      if (marka) params.marka = marka;
      if (stokDurumu === 'inStock') params.stokBos = false;
      if (stokDurumu === 'outOfStock') params.stokBos = true;
      
      const response = await axios.get('/stok', { params });
      const data = response.data?.data || response.data;
      return {
        items: Array.isArray(data) ? data : [],
        total: response.data?.meta?.total || response.data?.total || Array.isArray(data) ? data.length : 0,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}