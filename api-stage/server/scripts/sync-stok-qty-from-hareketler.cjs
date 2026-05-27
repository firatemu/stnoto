/**
 * product_location_stocks.qtyOnHand değerlerini stok_hareketleri + ambar bazında hizalar.
 * - Faturası İPTAL olan hareketler dahil edilmez (stok-miktar.util ile aynı mantık).
 * - warehouseId boş hareketler: kiracının varsayılan ambarına yazılır.
 * - Aynı depoda birden fazla raf satırı varsa miktar ilk rafa (location.code asc) yazılır, diğerleri 0 olur.
 *
 * Kullanım: node scripts/sync-stok-qty-from-hareketler.cjs
 * Önizleme: DRY_RUN=1 node scripts/sync-stok-qty-from-hareketler.cjs
 * Tek kiracı: TENANT_ID=uuid node scripts/sync-stok-qty-from-hareketler.cjs
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ADD = new Set(['GIRIS', 'SAYIM_FAZLA', 'IADE', 'IPTAL_GIRIS']);
const SUB = new Set(['CIKIS', 'SATIS', 'SAYIM_EKSIK', 'IPTAL_CIKIS']);

function signedQty(h) {
  if (h.faturaKalemi?.fatura?.durum === 'IPTAL') return 0;
  const t = h.hareketTipi;
  const m = h.miktar;
  if (ADD.has(t)) return m;
  if (SUB.has(t)) return -m;
  return 0;
}

async function main() {
  const tenantId = process.env.TENANT_ID?.trim() || null;
  const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

  const defaultWarehouseByTenant = new Map();
  async function resolveDefaultWid(tid) {
    const key = tid ?? '__null__';
    if (defaultWarehouseByTenant.has(key)) return defaultWarehouseByTenant.get(key);
    const w = await prisma.warehouse.findFirst({
      where: {
        active: true,
        isDefault: true,
        ...(tid ? { tenantId: tid } : {}),
      },
    });
    const fallback =
      w ??
      (await prisma.warehouse.findFirst({
        where: { active: true, ...(tid ? { tenantId: tid } : {}) },
        orderBy: { code: 'asc' },
      }));
    const id = fallback?.id ?? null;
    defaultWarehouseByTenant.set(key, id);
    return id;
  }

  const stokWhere = {
    sadeceKategoriTanimi: { not: true },
    sadeceMarkaTanimi: { not: true },
    ...(tenantId ? { tenantId } : {}),
  };

  const stoklar = await prisma.stok.findMany({
    where: stokWhere,
    select: { id: true, stokKodu: true, tenantId: true },
  });

  console.log(`İşlenecek stok sayısı: ${stoklar.length}${dryRun ? ' (DRY_RUN)' : ''}`);

  let updatedRows = 0;
  let skippedNoWarehouse = 0;
  let skippedNoPls = 0;

  for (const stok of stoklar) {
    const hareketler = await prisma.stokHareket.findMany({
      where: { stokId: stok.id },
      include: {
        faturaKalemi: { include: { fatura: { select: { durum: true } } } },
      },
    });

    const byWh = new Map();
    for (const h of hareketler) {
      let wid = h.warehouseId;
      if (!wid) {
        wid = await resolveDefaultWid(stok.tenantId);
        if (!wid) {
          skippedNoWarehouse++;
          continue;
        }
      }
      byWh.set(wid, (byWh.get(wid) || 0) + signedQty(h));
    }

    for (const [warehouseId, targetQty] of byWh) {
      const plsList = await prisma.productLocationStock.findMany({
        where: { productId: stok.id, warehouseId },
        include: { location: { select: { code: true } } },
        orderBy: { location: { code: 'asc' } },
      });

      if (plsList.length === 0) {
        skippedNoPls++;
        if (targetQty !== 0) {
          console.log(
            `[atlandı] ${stok.stokKodu} depo=${warehouseId} hedef=${targetQty} — product_location_stocks kaydı yok`,
          );
        }
        continue;
      }

      const first = plsList[0];
      if (dryRun) {
        console.log(
          `[dry-run] ${stok.stokKodu} depo=${warehouseId} -> ilk raf qty ${first.qtyOnHand} => ${targetQty} (+${plsList.length - 1} satır sıfırlanacak)`,
        );
        updatedRows += plsList.length;
        continue;
      }

      await prisma.productLocationStock.update({
        where: { id: first.id },
        data: { qtyOnHand: targetQty },
      });
      updatedRows++;

      for (let i = 1; i < plsList.length; i++) {
        if (plsList[i].qtyOnHand !== 0) {
          await prisma.productLocationStock.update({
            where: { id: plsList[i].id },
            data: { qtyOnHand: 0 },
          });
          updatedRows++;
        }
      }
    }
  }

  console.log('---');
  console.log(
    `Bitti. Güncellenen/önizlenen satır: ${updatedRows}, ambar bulunamadı (atlanan hareket): ${skippedNoWarehouse}, PLS yok: ${skippedNoPls}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
