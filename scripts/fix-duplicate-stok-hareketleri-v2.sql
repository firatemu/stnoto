-- ==================================================================================
-- fix-duplicate-stok-hareketleri-v2.sql
-- 
-- Amacı: "Veri Onarımı: Eksik Stok Hareketi: FaturaNo" şeklindeki mükerrer
-- hareketleri tespit edip silmek. 
-- Eşleşme kuralı: Aynı stok_id, aynı miktar, একই hareket_tipi ve 
-- orijinal kaydın açıklamasının içerisinde FaturaNo geçen kayıtları mükerrer say.
-- ==================================================================================

BEGIN;

CREATE TEMP TABLE repair_records AS
SELECT 
  id AS repair_id,
  "stokId" AS stok_id,
  "hareketTipi" as hareket_tipi,
  miktar,
  aciklama as repair_aciklama,
  SPLIT_PART(aciklama, ': ', 3) AS invoice_no
FROM stok_hareketleri
WHERE aciklama LIKE 'Veri Onarımı: Eksik Stok Hareketi: %';

SELECT 'Tespit edilen Veri Onarım kayıt sayısı: ' || COUNT(*) FROM repair_records;

CREATE TEMP TABLE mukerrer_hareketler AS
SELECT 
  r.repair_id,
  r.stok_id,
  r.repair_aciklama,
  o.id AS original_id,
  o.aciklama AS original_aciklama
FROM repair_records r
JOIN stok_hareketleri o
  ON o."stokId"       = r.stok_id
  AND o."hareketTipi" = r.hareket_tipi
  AND o.miktar        = r.miktar
  AND o.aciklama NOT LIKE 'Veri Onarımı:%'
  AND o.aciklama LIKE '%' || r.invoice_no || '%';

SELECT 'Mükerrer olduğu kesinleşen (originali olan) kayıt sayısı: ' || COUNT(*) FROM mukerrer_hareketler;

-- Görelim
SELECT repair_id, stok_id, repair_aciklama, original_id, original_aciklama
FROM mukerrer_hareketler
LIMIT 10;

-- 2. SILME
WITH deleted AS (
  DELETE FROM stok_hareketleri
  WHERE id IN (SELECT repair_id FROM mukerrer_hareketler)
  RETURNING id
)
SELECT 'Silinen kayıt sayısı: ' || COUNT(*) FROM deleted;

-- 3. MIKTARLARI HESAPLA VE GUNCELLE
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
  'Güncellenen stok miktar sayısı: ' || COUNT(*) FROM guncelleme;

-- 4. KONTROL 2541701002
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

SELECT 'Kalan yalnız Veri Onarım kayıtları sayısı: ' || COUNT(*)
FROM stok_hareketleri
WHERE aciklama LIKE 'Veri Onarımı:%';
