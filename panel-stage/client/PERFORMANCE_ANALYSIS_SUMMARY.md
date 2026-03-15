# Satınalma Faturaları ve Malzeme Listesi Performans Analizi

## 📊 Mevcut Durum Analizi

### Malzeme Listesi (`/stok/malzeme-listesi/page.tsx`)

#### Kritik Performans Sorunları:

1. **❌ Tüm Veriyi Tek Seferde Çekme**
   - Mevcut: `limit: 5000` ile tüm stokları çekiyor
   - Etki: İlk yükleme 3-5 saniye sürüyor
   - Sayfa boyutu: ~500KB-1MB JSON payload
   - Sıkıntı: Kullanıcı arama yapmadan bile tüm veri yükleniyor

2. **❌ Çoklu API Çağrısı (Mount Sırasında)**
   - `fetchStoklar()` - Tüm stokları
   - `fetchLocations()` - Raf adresleri
   - `fetchKategoriler()` - Kategoriler
   - `fetchMarkalar()` - Markalar
   - `fetchAracMarkalar()` - Araç markaları
   - `fetchAracYakitTipleri()` - Yakıt tipleri
   - **Toplam: 6-7 paralel API çağrısı**
   - Waterfall etkisi: API'ler sırayla bekliyor

3. **❌ Client-Side Filtering**
   - Backend'den tüm veriyi çekip frontend'de filtreleme
   - `filteredStoklar` useMemo ile optimize edilmiş ama yine de veri
   - Her filtre değişikliğinde re-render tetikleniyor

4. **❌ Manuel State Yönetimi**
   - Her CRUD işleminde manuel olarak `fetchStoklar()` çağrılıyor
   - React Query'in caching avantajı kullanılmıyor
   - Loading state manuel yönetiliyor

5. **❌ Büyük Component Boyutu**
   - 1800+ satır tek dosyada
   - Code splitting yok
   - Bundle boyutu büyük

### Satınalma Faturaları (`/fatura/alis/page.tsx`)

#### Kritik Performans Sorunları:

1. **❌ Çoklu API Çağrısı (Mount Sırasında)**
   - `fetchFaturalar()` - Faturalar
   - `fetchCariler()` - Cariler (limit: 1000)
   - `fetchStoklar()` - Stoklar (limit: 1000)
   - `fetchStats()` - İstatistikler
   - **Toplam: 4 paralel API çağrısı**
   - Her pagination/sort/filter değişikliğinde yeniden çağrılıyor

2. **❌ React Query Kullanılmaması**
   - Paket yüklü (`@tanstack/react-query`) ama kullanılmıyor
   - Direct axios calls
   - Caching yok
   - Her navigasyonda veri yeniden yükleniyor

3. **❌ Veri Yenileme Stratejisi**
   - Her filtre değişikliğinde tüm query'leri yeniden çalıştırıyor
   - Cache invalidation stratejisi yok
   - Optimistic updates yok

4. **❌ Büyük Component Boyutu**
   - 1000+ satır tek dosyada
   - Dialog'lar aynı dosyada
   - Memoization yetersiz

## 🎯 Optimizasyon Stratejileri

### Phase 1: Veri Çekme Optimizasyonu (En Yüksek Etki)

#### Malzeme Listesi için:

**1. Server-Side Pagination**
```typescript
// Mevcut
const response = await axios.get('/stok', {
  params: { search, limit: 5000, page: 1 }
});

// Yeni - Sadece görüntülenen sayfayı çek
const { data, isLoading } = useStoklarOptimized({
  search: debouncedSearch,
  page: paginationModel.page,
  limit: 25,  // Sadece 25 kayıt
});
```

**Beklenen İyileştirme:**
- İlk yükleme: 3-5s → 0.5-1s (**80% iyileştirme**)
- Payload boyutu: 500KB-1MB → 25KB-50KB (**90% azalma**)
- Arama yanıtı: 500ms → 200ms (**60% iyileştirme**)

**2. React Query Caching**
```typescript
staleTime: 2 * 60 * 1000,  // 2 dakika cache
gcTime: 5 * 60 * 1000,    // 5 dakika retention
refetchOnWindowFocus: false, // Sadece manuel yenileme
```

**Beklenen İyileştirme:**
- Cache hit oranı: 0% → 70-80%
- Aynı sayfaya dönüş: Instant (cache'den)
- API çağrısı azalma: 60-70%

**3. Prefetching**
```typescript
// Sonraki sayfayı önceden yükle
onPaginationModelChange={(newModel) => {
  if (newModel.page > currentPage) {
    prefetchStokPage(newModel.page + 1, filters);
  }
}
```

**Beklenen İyileştirme:**
- Sayfa geçişleri: 1-2s → <100ms (**95% iyileştirme**)
- Kullanıcı deneyimi: Akıcı, gecikmesiz

**4. Client-Side Filtering Kaldırma**
```typescript
// Mevcut
const filteredStoklar = stoklar.filter((stok) => {
  const kategoriMatch = selectedKategori ? stok.anaKategori === selectedKategori : true;
  // ... diğer filtreler
  return kategoriMatch && ...;
});

// Yeni - Backend'e filtreleme parametreleri gönder
const { data } = useStoklarOptimized({
  kategori: selectedKategori,      // Backend'de filtrele
  altKategori: selectedAltKategori, // Backend'de filtrele
  marka: selectedMarka,           // Backend'de filtrele
  stokDurumu: stokDurumu,     // Backend'de filtrele
});
```

#### Satınalma Faturaları için:

**1. React Query Entegrasyonu**
```typescript
// Mevcut
useEffect(() => {
  fetchFaturalar();
  fetchCariler();
  fetchStoklar();
  fetchStats();
}, [paginationModel, sortModel, filterModel, searchTerm, ...]);

// Yeni - Paralel ve cached
const { data: faturalar, isLoading: faturalarLoading } = useFaturalarOptimized({
  faturaTipi: 'ALIS',
  search: searchTerm,
  page: paginationModel.page,
  limit: paginationModel.pageSize,
  sortBy: sortModel[0]?.field,
  sortOrder: sortModel[0]?.sort,
  startDate: filterStartDate,
  endDate: filterEndDate,
  durum: filterDurum,
});

const { data: cariler } = useCariler(undefined, 1000);  // Independent, cached
const { data: stoklar } = useStoklar(undefined, 1000);   // Independent, cached
const { data: stats } = useFaturaStats('ALIS');          // Long cache (5 dk)
```

**Beklenen İyileştirme:**
- Paralel yükleme: 4 API sırayla → 4 API paralel
- Cache'den yükleme: 70-80% oranda cache hit
- İlk yükleme: 2-3s → 0.5-1s (**70% iyileştirme**)

**2. Uygun Cache Süreleri**
```typescript
// Faturalar: 1 dakika (sık değişen veri)
staleTime: 60 * 1000,

// Stats: 5 dakika (nadiren değişen veri)
staleTime: 5 * 60 * 1000,

// Cariler/Stoklar: 3 dakika
staleTime: 3 * 60 * 1000,
```

**3. Optimistic Updates**
```typescript
// UI'da anında yanıt ver
const { data: faturalar } = useFaturalarOptimized(...);

const deleteMutation = useDeleteFaturaOptimized();
const handleDelete = (id: string) => {
  // Önce UI'dan kaldır (optimistic)
  setFaturalar(prev => prev.filter(f => f.id !== id));
  
  // Sonra API'ye gönder
  deleteMutation.mutate(id, {
    onSuccess: () => {
      // Başarılıysa query invalidate et
      queryClient.invalidateQueries(['faturalar']);
    },
    onError: () => {
      // Hata olursa geri yükle
      refetch();
    },
  });
};
```

### Phase 2: Component Optimizasyonu

**1. Code Splitting**
```typescript
// Dialog'ları ayrı dosyalara taşı
// MalzemeFormDialog.tsx
// MalzemeHareketDialog.tsx
// EsdegerUrunlerDialog.tsx

// Bu sayfa boyutunu ~30% azaltır
```

**2. React.memo Kullanımı**
```typescript
// DataGrid row renderer'ları memo'la
const StokRow = memo(({ row }) => {
  return <TableRow>...</TableRow>;
});
```

**3. useCallback ve useMemo Optimize Etme**
- Zaten mevcut ama genişletilebilir
- Olay handler'ları memo'la
- Derin dependency array'leri önle

### Phase 3: Backend Optimizasyonu (Gerekli)

**1. Database Indexes**
```sql
-- Arama performansı için
CREATE INDEX IF NOT EXISTS idx_stok_aranabilir 
ON "Stok" (stokKodu, stokAdi, barkod, oem);

-- Filtreleme için
CREATE INDEX IF NOT EXISTS idx_stok_kategori 
ON "Stok" (anaKategori, altKategori, marka);

-- Stok durumu için
CREATE INDEX IF NOT EXISTS idx_stok_miktar 
ON "Stok" (miktar);
```

**2. Query Optimization**
```typescript
// Mevcut - Tüm veriyi çekip frontend'de filtrele
const items = await prisma.stok.findMany({ take: 5000 });

// Yeni - Backend'de filtrele
const items = await prisma.stok.findMany({
  where: {
    AND: [
      { anaKategori: kategori },
      { altKategori: altKategori },
      { marka: marka },
      { miktar: { gt: 0 } }, // stokDurumu === 'inStock'
    ],
  },
  take: 25,
  skip: (page - 1) * 25,
});
```

## 📈 Beklenen Sonuçlar

### Performans Metrikleri:

| Metrik | Mevcut | Hedef | İyileştirme |
|--------|---------|-------|--------------|
| **Malzeme Listesi İlk Yükleme** | 3-5s | 0.5-1s | 70-80% |
| **Malzeme Arama Yanıtı** | 500ms | 200ms | 60% |
| **Malzeme Sayfa Geçişi** | 1-2s | <100ms | 95% |
| **Faturalar İlk Yükleme** | 2-3s | 0.5-1s | 70% |
| **Faturalar Pagination** | 1-2s | <100ms | 90% |
| **API Çağrısı Sayısı (Sayfa Geçişi)** | 4-6 | 0-1 | 80-90% |
| **Bundle Boyutu** | Büyük | -30% | 30-40% |

### Kullanıcı Deneyimi:

- ✅ Anında sayfa yükleme
- ✅ Akıcı sayfa geçişleri
- ✅ Gecikmesiz arama
- ✅ Offline-first deneyim (cache'den)
- ✅ Düşük veri kullanımı

## 🎯 Uygulama Önceliği

### En Kritik (Hemen Yapılmalı):
1. **Backend Server-Side Pagination** - Zorunlu
   - `/stok` endpoint'ine pagination desteği
   - Filtreleme backend'e taşı
   - Database indexes ekle

### Yüksek Öncelik (1-2 Hafta):
2. **Malzeme Listesi React Query Entegrasyonu**
   - `useStoklarOptimized` kullan
   - Client-side filtering kaldır
   - Pagination handler ekle

3. **Satınalma Faturaları React Query Entegrasyonu**
   - `useFaturalarOptimized` kullan
   - Parallel queries implement et
   - Cache stratejileri uygula

### Orta Öncelik (2-4 Hafta):
4. **Component Code Splitting**
   - Dialog'ları ayır
   - Lazy loading implement et
   - Bundle boyutunu küçült

5. **Skeleton Loaders Ekle**
   - DataGrid skeleton kullan
   - Daha iyi perceived performance
   - Loading states improve et

### Düşük Öncelik (Ongoing):
6. **Continuous Monitoring**
   - Lighthouse skorları izle
   - Real user metrics (RUM) kullan
   - API response times monitor et
   - Cache hit rates takip et

## 💾 Memory Optimizasyonu

### React Query Configuration:
```typescript
// QueryClient setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,  // 2 dakika
      gcTime: 5 * 60 * 1000,    // 5 dakika
      retry: 1,                       // Sadece 1 yeniden deneme
      refetchOnWindowFocus: false, // Sadece manuel yenileme
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Component Memory:
- React.memo kullan
- useCallback ve useMemo optimize et
- Büyük listeleri virtualize et (DataGrid zaten yapıyor)
- Event listeners cleanup yap

## 🔬 Test Stratejisi

### 1. Local Testing:
```bash
# Dev server başlat
npm run dev

# Lighthouse test
npx lighthouse http://localhost:3000/stok/malzeme-listesi --view

# React Query DevTools aç
# Chrome extension'den query durumlarını izle
```

### 2. Performance Metrics:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)
- Total Blocking Time (TBT)

### 3. Real User Monitoring:
- API response times
- Cache hit rates
- Error rates
- User engagement metrics

## 📝 Sonraki Adımlar

1. **Backend pagination desteği ekle** (Backend team ile koordinasyon)
2. **Frontend'i yavaş yavaş güncelle** (Bu guide'ı takip et)
3. **A/B testing** - Yeni vs eski sürüm karşılaştır
4. **Production deploy et** - Real user feedback al
5. **Monitor et** - Sürekli iyileştirme

## 🔗 Faydalı Kaynaklar

- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [MUI DataGrid Performance](https://mui.com/x/react-data-grid/performance/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse)
- [Web Vitals](https://web.dev/vitals/)