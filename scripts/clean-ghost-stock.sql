-- Lock'ları temizle ve stok hareketlerini sil
-- 1. Bağlantıları sonlandır (önemli)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
  AND query LIKE '%stok_hareketleri%'
  AND pid <> pg_backend_pid();

-- 2. Senaryo 1: Fatura bağlantısı olmayan SATIS/GIRIS
DELETE FROM stok_hareketleri
WHERE "hareketTipi" IN ('SATIS', 'GIRIS')
  AND "faturaKalemiId" IS NULL
  AND (aciklama IS NULL OR aciklama = '');

-- 3. Senaryo 2: Fatura Silme ters kayıtları
DELETE FROM stok_hareketleri
WHERE "hareketTipi" IN ('IADE', 'CIKIS')
  AND aciklama LIKE 'Fatura Silme:%';
