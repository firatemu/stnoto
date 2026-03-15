# Satınalma Faturaları ve Malzeme Listesi Performans Optimizasyonu

## ✅ Tamamlanan Optimizasyonlar

### 1. React Query Hooks Oluşturuldu ✓
- `useOptimizedStok.ts` - Server-side pagination ile optimize edilmiş stok hook'u
- `useOptimizedFatura.ts` - Caching ile optimize edilmiş fatura hook'u
- `DataGridSkeleton.tsx` - Yükleniyor görseli component'i

### 2. Temel Optimizasyon Stratejileri

#### Malzeme Listesi İçin:
1. **Server-Side Pagination**: Tüm verileri bir seferde çekmek yerine sayfa bazlı yükleme
2. **React Query Caching**: 2-5 dakika cache ile gereksiz API çağrılarını önleme
3. **Prefetching**: Sonraki sayfaları önceden yükleme
4. **Client-Side Filtering Kaldırma**: Backend'e filtreleme yükleme

#### Satınalma Faturaları İçin:
1. **Parallel Queries**: Bağımsız verileri paralel olarak çekme
2. **Longer Cache for Stats**: İstatistikler için 5 dakika cache
3. **Optimistic Updates**: UI'da anında yanıt verme
4. **Proper Invalidation**: Sadece gerekli query'leri invalidate etme

## 🚀 Uygulanacak Değişiklikler

### Adım 1: Malzeme Listesi'ye React Query Entegrasyonu

**Mevcut kod (satır ~650-730):**
```typescript
// Fetch stoklar - useCallback ile optimize edilmiş (tüm sayfalar için veri çek)
const fetchStoklar = useCallback(async () => {
  try {
    setLoading(true);
    const response = await axios.get('/stok', {
      params: { search: debouncedSearch, limit: 5000, page: 1 },  // ❌ TÜM veriyi çekiyor
    });
    const stokData = response.data.data || [];
    setStoklar(stokData);
  } catch (error) {
    console.error('Stok verisi alınamadı:', error);
    setStoklar([]);
  } finally {
    setLoading(false);
  }
}, [debouncedSearch]);
```

**Yeni kod:**
```typescript
// React Query ile optimize edilmiş
const { data: stokData, isLoading, refetch } = useStoklarOptimized({
  search: debouncedSearch,
  page: paginationModel.page,
  limit: paginationModel.pageSize,
  kategori: selectedKategori,
  altKategori: selectedAltKategori,
  marka: selectedMarka,
  stokDurumu: stokDurumu,
});

// filteredStoklar kaldırılacak - backend filtreliyor
// DataGrid rows={stokData?.items || []} kullanılacak
```

### Adım 2: Pagination State Güncelleme

**Mevcut kod (satır ~770-800):**
```typescript
const [stoklar, setStoklar] = useState<Malzeme[]>([]);
// ... manuel state yönetimi
```

**Yeni kod:**
```typescript
const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
  page: 0,
  pageSize: 25,
});

// DataGrid pagination change handler
const handlePaginationModelChange = (newModel: GridPaginationModel) => {
  setPaginationModel(newModel);
  
  // Önceden sonraki sayfayı yükle (prefetch)
  if (newModel.page > paginationModel.page) {
    prefetchStokPage(newModel.page + 1, {
      search: debouncedSearch,
      kategori: selectedKategori,
      altKategori: selectedAltKategori,
      marka: selectedMarka,
      stokDurumu: stokDurumu,
    });
  }
};
```

### Adım 3: Mutations Güncelleme

**Mevcut kod (satır ~500-650):**
```typescript
const handleSubmit = useCallback(async (submitFormData: MalzemeFormData) => {
  try {
    // ... API çağrıları
    const response = await axios.post('/stok', payload);
    // ... manuel yenileme
    fetchStoklar();  // ❌ Tüm veriyi yeniden çekiyor
  } catch (error) {
    // ... error handling
  }
}, [editingMalzeme, stoklar, handleCloseDialog, debouncedSearch]);
```

**Yeni kod:**
```typescript
const createMutation = useCreateStokOptimized();
const updateMutation = useUpdateStokOptimized();
const deleteMutation = useDeleteStokOptimized();

const handleSubmit = useCallback(async (submitFormData: MalzemeFormData) => {
  // ... validation logic aynı kalacak
  try {
    if (editingMalzeme) {
      await updateMutation.mutateAsync({ id: editingMalzeme.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    // React Query otomatik invalidate edecek - manuel fetch gerekmez
    handleCloseDialog();
  } catch (error: any) {
    // ... error handling aynı kalacak
  }
}, [editingMalzeme, updateMutation, createMutation, handleCloseDialog]);
```

## 📊 Beklenen Performans İyileştirmeleri

| Metrik | Mevcut | Optimizasyon Sonrası | İyileştirme |
|--------|---------|---------------------|--------------|
| İlk Yükleme | 3-5 sn | 0.5-1 sn | **70-80%** |
| Arama Yanıtı | 500 ms | 200 ms | **60%** |
| Sayfa Geçişleri | 1-2 sn | <100 ms | **90%** |
| Bundle Boyutu | Büyük | Optimize edilmiş | **30-40%** |

## 🔧 Backend Gerekli Değişiklikler

### /stok Endpoint için:
```typescript
// Server-side pagination desteği ekle
@Get()
async findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 25,
  @Query('search') search?: string,
  @Query('anaKategori') anaKategori?: string,
  @Query('altKategori') altKategori?: string,
  @Query('marka') marka?: string,
  @Query('stokBos') stokBos?: boolean,
) {
  const skip = (page - 1) * limit;
  
  const where: any = {};
  if (search) {
    where.OR = [
      { stokKodu: { contains: search, mode: 'insensitive' } },
      { stokAdi: { contains: search, mode: 'insensitive' } },
      { barkod: { contains: search, mode: 'insensitive' } },
      { oem: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (anaKategori) where.anaKategori = anaKategori;
  if (altKategori) where.altKategori = altKategori;
  if (marka) where.marka = marka;
  if (stokBos === true) where.miktar = { lte: 0 };
  if (stokBos === false) where.miktar = { gt: 0 };
  
  const [items, total] = await Promise.all([
    this.prisma.stok.findMany({
      where,
      skip,
      take: limit,
      orderBy: { stokKodu: 'asc' },
    }),
    this.prisma.stok.count({ where }),
  ]);
  
  return { data: items, meta: { total } };
}
```

## 📝 Uygulama Kontrol Listesi

### Ön Koşullar:
- [x] React Query paketi yüklü (`@tanstack/react-query`)
- [x] Optimized hooks oluşturuldu
- [ ] Backend pagination desteği eklenecek
- [ ] Frontend React Query entegrasyonu yapılacak

### Malzeme Listesi:
- [ ] `fetchStoklar` → `useStoklarOptimized` ile değiştir
- [ ] `filteredStoklar` kaldır (backend filtreliyor)
- [ ] DataGrid pagination handler ekle
- [ ] Mutations → React Query mutations ile değiştir
- [ ] Skeleton loader ekle

### Satınalma Faturaları:
- [ ] `fetchFaturalar`, `fetchCariler`, `fetchStoklar`, `fetchStats` → React Query
- [ ] Parallel query kullanımı
- [ ] Cache stratejileri uygula
- [ ] Mutations optimize et

## 🎯 Sonraki Adımlar

1. **Backend pagination desteği ekle** (En kritik)
2. **Frontend'i yavaş yavaş güncelle**
3. **Performans ölçümleri yap**
4. **Production deploy et**

## 💡 Ek İpuçları

### React Query DevTools:
- Browser devtools'de query durumlarını izle
- Cache hit/miss oranlarını kontrol et
- Prefetch başarısını test et

### Lighthouse ile Test:
```bash
npx lighthouse http://localhost:3000/stok/malzeme-listesi --view
```

### Network Monitoring:
- Chrome DevTools Network tab'ı açık tut
- API çağrı sayısını izle
- Payload boyutlarını kontrol et