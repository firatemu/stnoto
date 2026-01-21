# Form Controls Style Guide

Bu dokümanda, projede kullanılacak standart form kontrol stilleri açıklanmaktadır.

## 📋 Kullanılabilir CSS Class'ları

### 1. `form-control-select` - Select/Dropdown için

Material-UI Select/Dropdown bileşenleri için kullanılır.

**Özellikler:**
- ✅ Dark mode uyumlu
- ✅ Tutarlı font (AR One Sans)
- ✅ Disabled state desteği
- ✅ Hover ve focus efektleri
- ✅ Tutarlı renkler (CSS variables)

**Kullanım:**

```tsx
<FormControl fullWidth size="small" className="form-control-select">
  <InputLabel>Kategori</InputLabel>
  <Select
    label="Kategori"
    value={selectedValue}
    onChange={handleChange}
  >
    <MenuItem value="">Hepsi</MenuItem>
    <MenuItem value="option1">Seçenek 1</MenuItem>
  </Select>
</FormControl>
```

**Disabled Kullanımı:**

```tsx
<FormControl 
  fullWidth 
  size="small" 
  disabled={!isEnabled}
  className="form-control-select"
>
  <InputLabel>Alt Kategori</InputLabel>
  <Select label="Alt Kategori" value={value}>
    {/* options */}
  </Select>
</FormControl>
```

### 2. `form-control-textfield` - TextField için

Material-UI TextField bileşenleri için kullanılır.

**Özellikler:**
- ✅ Dark mode uyumlu
- ✅ Tutarlı font (AR One Sans)
- ✅ Hover ve focus efektleri
- ✅ Tutarlı renkler (CSS variables)

**Kullanım:**

```tsx
<TextField
  fullWidth
  size="small"
  className="form-control-textfield"
  placeholder="Arama yapın..."
  value={searchValue}
  onChange={handleSearch}
/>
```

**Label ile kullanım:**

```tsx
<TextField
  fullWidth
  label="Stok Kodu"
  className="form-control-textfield"
  value={stokKodu}
  onChange={handleChange}
/>
```

## 🎨 Kullanılan CSS Variables

Tüm class'lar aşağıdaki CSS değişkenlerini kullanır:

- `--input`: Input arka plan rengi
- `--border`: Border rengi
- `--ring`: Focus border rengi
- `--foreground`: Metin rengi
- `--muted-foreground`: İkincil metin rengi (label)
- `--font-sans`: Font ailesi (AR One Sans)

## 🌙 Dark Mode Desteği

Tüm class'lar otomatik olarak dark mode'u destekler. Ek bir stil eklemenize gerek yoktur.

## 📝 Örnek Sayfa Kullanımı

```tsx
import { FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';

function MyPage() {
  return (
    <Box>
      {/* Arama TextField */}
      <TextField
        fullWidth
        size="small"
        className="form-control-textfield"
        placeholder="Ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Kategori Select */}
      <FormControl fullWidth size="small" className="form-control-select">
        <InputLabel>Kategori</InputLabel>
        <Select
          label="Kategori"
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
        >
          <MenuItem value="">Hepsi</MenuItem>
          <MenuItem value="cat1">Kategori 1</MenuItem>
          <MenuItem value="cat2">Kategori 2</MenuItem>
        </Select>
      </FormControl>

      {/* Disabled Alt Kategori Select */}
      <FormControl 
        fullWidth 
        size="small" 
        disabled={!kategori}
        className="form-control-select"
      >
        <InputLabel>Alt Kategori</InputLabel>
        <Select
          label="Alt Kategori"
          value={altKategori}
          onChange={(e) => setAltKategori(e.target.value)}
        >
          <MenuItem value="">Hepsi</MenuItem>
          <MenuItem value="sub1">Alt Kategori 1</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
```

## ⚠️ Önemli Notlar

1. **Class'ı FormControl/TextField'e ekleyin**, Select'e değil
2. **sx prop ile birlikte kullanılabilir** (ek özel stiller için)
3. **Size prop'u her zaman ekleyin** (örn: `size="small"`)
4. **Label ve value her zaman eşleşmeli** (Select için)

## 🔄 Güncelleme

Bu class'lar `/var/www/panel-stage/client/src/app/globals.css` dosyasında tanımlıdır.

Değişiklik yapmak için bu dosyayı düzenleyin ve tüm sayfalar otomatik olarak güncellenecektir.

## 📚 Referans Sayfalar

Bu class'ların kullanıldığı örnek sayfalar:

- `/stok/malzeme-listesi` - Malzeme Listesi
- (Diğer sayfalar eklenecek)

---

**Son Güncelleme:** 2026-01-21
**Versiyon:** 1.0.0
