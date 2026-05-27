-- ==================================================================================
-- fix-duplicate-stok-hareketleri.sql
-- 
-- Amacı: "Veri Onarımı: Eksik Stok Hareketi" prefix'li mükerrer stok hareketlerini
-- bul ve sil. Aynı fatura kalemine (faturaKalemiId) + aynı stokId'ye sahip orijinal
-- bir kayıt varsa, "Veri Onarımı" kaydı mükerrer sayılır ve silinir.
-- Ardından etkilenen stokların product_location_stocks.qtyOnHand değeri güncellenir.
-- ==================================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────
-- ADIM 1: Mükerrer kayıtları tespit et ve geçici tabloya al
-- ─────────────────────────────────────────────────────────────────
CREATE TEMP TABLE mukerrer_hareketler AS
SELECT 
  repair.id        AS repair_id,
  repair."stokId"  AS stok_id,
  repair.aciklama  AS repair_aciklama,
  original.id      AS original_id,
  original.aciklama AS original_aciklama,
  repair."faturaKalemiId"
FROM stok_hareketleri repair
JOIN stok_hareketleri original
  ON original."faturaKalemiId" = repair."faturaKalemiId"
  AND original."stokId"       = repair."stokId"
  AND original.id             != repair.id
  AND original.aciklama NOT LIKE 'Veri Onarımı:%'
WHERE repair.aciklama LIKE 'Veri Onarımı: Eksik Stok Hareketi: %'
  AND repair."faturaKalemiId" IS NOT NULL;

-- Kaç tane var?
SELECT 
  'Mükerrer kayıt sayısı: ' || COUNT(*) AS bilgi
FROM mukerrer_hareketler;

-- Detay listesi:
SELECT 
  repair_id,
  stok_id,
  repair_aciklama,
  original_id,
  original_aciklama
FROM mukerrer_hareketler
ORDER BY repair_aciklama;

-- ─────────────────────────────────────────────────────────────────
-- ADIM 2: Mükerrer "Veri Onarımı" kayıtlarını sil
-- ─────────────────────────────────────────────────────────────────
WITH deleted AS (
  DELETE FROM stok_hareketleri
  WHERE id IN (SELECT repair_id FROM mukerrer_hareketler)
  RETURNING id, aciklama
)
SELECT 
  'Silinen kayıt: ' || id || ' | ' || aciklama AS silme_log
FROM deleted;

-- ─────────────────────────────────────────────────────────────────
-- ADIM 3: Etkilenen stokların product_location_stocks.qtyOnHand
-- değerlerini yeniden hesapla ve güncelle
-- ─────────────────────────────────────────────────────────────────
WITH hesaplanan AS (
  SELECT 
    sh."stokId",
    sh."warehouseId",
    SUM(CASE WHEN sh."hareketTipi" IN ('GIRIS', 'IADE') THEN sh.miktar ELSE 0 END) -
    SUM(CASE WHEN sh."hareketTipi" IN ('SATIS', 'CIKIS') THEN sh.miktar ELSE 0 END) AS yeni_miktar
  FROM stok_hareketleri sh
  WHERE sh."stokId" IN (SELECT DISTINCT stok_id FROM mukerrer_hareketler)
    AND sh."warehouseId" IS NOT NULL
  GROUP BY sh."stokId", sh."warehouseId"
),
guncelleme AS (
  UPDATE product_location_stocks pls
  SET 
    "qtyOnHand" = h.yeni_miktar,
    "updatedAt" = NOW()
  FROM hesaplanan h
  WHERE pls."productId"   = h."stokId"
    AND pls."warehouseId" = h."warehouseId"
    AND pls."qtyOnHand" != h.yeni_miktar
  RETURNING pls."productId", pls."warehouseId", h.yeni_miktar
)
SELECT 
  'Güncellenen stok: productId=' || "productId" || 
  ' | warehouseId=' || "warehouseId" || 
  ' | yeni miktar=' || yeni_miktar AS guncelleme_log
FROM guncelleme;

-- ─────────────────────────────────────────────────────────────────
-- ADIM 4: Doğrulama – 2541701002 stok kodunun SF00044 hareketleri
-- ─────────────────────────────────────────────────────────────────
SELECT 
  sh.id,
  sh."hareketTipi",
  sh.miktar,
  sh.aciklama,
  sh."faturaKalemiId",
  sh."createdAt"
FROM stok_hareketleri sh
JOIN stoklar s ON sh."stokId" = s.id
WHERE s."stokKodu" = '2541701002'
  AND sh.aciklama LIKE '%SF00044%'
ORDER BY sh."createdAt";

COMMIT;

-- ─────────────────────────────────────────────────────────────────
-- ÖZET
-- ─────────────────────────────────────────────────────────────────
SELECT 
  'Kalan Veri Onarımı kayıtları (yalnız, orijinali olmayan): ' || 
  COUNT(*) AS son_durum
FROM stok_hareketleri
WHERE aciklama LIKE 'Veri Onarımı: Eksik Stok Hareketi: %';
