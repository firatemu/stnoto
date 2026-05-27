-- Recalculate stock quantities and update product_location_stocks
WITH movement_sums AS (
  SELECT 
    "stokId", 
    "warehouseId",
    SUM(CASE WHEN "hareketTipi" IN ('GIRIS', 'IADE') THEN miktar ELSE 0 END) -
    SUM(CASE WHEN "hareketTipi" IN ('SATIS', 'CIKIS') THEN miktar ELSE 0 END) as calculated_qty
  FROM stok_hareketleri
  GROUP BY "stokId", "warehouseId"
),
updates AS (
  SELECT m."stokId", m."warehouseId", m.calculated_qty
  FROM movement_sums m
  JOIN "product_location_stocks" p ON p."productId" = m."stokId" AND p."warehouseId" = m."warehouseId"
  WHERE m.calculated_qty != p."qtyOnHand"
)
UPDATE "product_location_stocks" p
SET "qtyOnHand" = u.calculated_qty
FROM updates u
WHERE p."productId" = u."stokId" AND p."warehouseId" = u."warehouseId";
