/**
 * Stok hareketlerini satış ve satınalma faturalarından yeniden oluşturur.
 * Mevcut fatura kaynaklı hareketleri siler, ONAYLANDI faturalardan yeniden üretir.
 *
 * Kullanım (yerel):
 *   cd api-stage/server && npm run script:rebuild-stok-hareketleri
 *
 * Kullanım (Docker staging):
 *   docker compose -f docker/compose/docker-compose.base.yml -f docker/compose/docker-compose.staging.ghcr.yml exec backend-staging sh -c "cd /app/server && npm run script:rebuild-stok-hareketleri"
 *
 * Veya container adı farklıysa:
 *   docker exec -it <backend-container> sh -c "cd /app/server && npm run script:rebuild-stok-hareketleri"
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type HareketTipi = 'GIRIS' | 'CIKIS' | 'SATIS' | 'IADE';

async function main() {
  console.log('🔄 Stok hareketleri yeniden oluşturuluyor (faturalardan)...\n');

  // 1a. Fatura kaynaklı hareketleri sil
  const deletedFatura = await prisma.stokHareket.deleteMany({
    where: { faturaKalemiId: { not: null } },
  });
  console.log(`1a. Silindi: ${deletedFatura.count} fatura kaynaklı stok hareketi`);

  // 1b. İrsaliye kaynaklı hareketleri sil (fatura oluşturulduğunda çift sayım oluyor; sadece fatura kullanacağız)
  const deletedIrsaliye = await prisma.stokHareket.deleteMany({
    where: {
      faturaKalemiId: null,
      OR: [
        { aciklama: { startsWith: 'Satış İrsaliyesi:' } },
        { aciklama: { startsWith: 'Satın Alma İrsaliyesi:' } },
      ],
    },
  });
  console.log(`1b. Silindi: ${deletedIrsaliye.count} irsaliye kaynaklı stok hareketi`);

  // 1c. Fatura/irsaliye dışı hatalı hareketler: CIKIS/SATIS, faturaKalemiId yok, aciklama boş (çift kayıt/orphan)
  const deletedOrphan = await prisma.stokHareket.deleteMany({
    where: {
      faturaKalemiId: null,
      hareketTipi: { in: ['CIKIS', 'SATIS'] },
      OR: [{ aciklama: null }, { aciklama: '' }],
    },
  });
  console.log(`1c. Silindi: ${deletedOrphan.count} hatalı/orphan stok hareketi (CIKIS/SATIS, aciklama boş)\n`);

  const faturalar = await prisma.fatura.findMany({
    where: {
      durum: 'ONAYLANDI',
      deletedAt: null,
      faturaTipi: { in: ['SATIS', 'ALIS', 'SATIS_IADE', 'ALIS_IADE'] },
    },
    include: {
      kalemler: true,
      warehouse: true,
      satinAlmaIrsaliye: { select: { depoId: true } },
      irsaliye: { select: { depoId: true } },
    },
    orderBy: { tarih: 'asc' },
  });

  console.log(`2️⃣  İşlenecek fatura sayısı: ${faturalar.length}\n`);

  let toplamHareket = 0;

  for (const fatura of faturalar) {
    const warehouseId: string | null =
      fatura.warehouseId ??
      fatura.satinAlmaIrsaliye?.depoId ??
      fatura.irsaliye?.depoId ??
      null;

    const aciklama =
      fatura.faturaTipi === 'SATIS'
        ? `Satış Faturası: ${fatura.faturaNo}`
        : fatura.faturaTipi === 'SATIS_IADE'
          ? `Satış İade Faturası: ${fatura.faturaNo}`
          : fatura.faturaTipi === 'ALIS'
            ? `Alış Faturası: ${fatura.faturaNo}`
            : `Alış İade Faturası: ${fatura.faturaNo}`;

    let hareketTipi: HareketTipi;
    switch (fatura.faturaTipi) {
      case 'SATIS':
        hareketTipi = 'SATIS';
        break;
      case 'ALIS':
        hareketTipi = 'GIRIS';
        break;
      case 'SATIS_IADE':
        hareketTipi = 'GIRIS';
        break;
      case 'ALIS_IADE':
        hareketTipi = 'CIKIS';
        break;
      default:
        continue;
    }

    for (const kalem of fatura.kalemler) {
      if (!kalem.stokId || !kalem.miktar || kalem.miktar <= 0) continue;

      const birimFiyat = Number(kalem.birimFiyat) || 0;

      await prisma.stokHareket.create({
        data: {
          stokId: kalem.stokId,
          hareketTipi,
          miktar: kalem.miktar,
          birimFiyat,
          aciklama,
          warehouseId,
          faturaKalemiId: kalem.id,
          tenantId: fatura.tenantId,
        },
      });
      toplamHareket++;
    }

    if (fatura.kalemler.length > 0) {
      console.log(
        `   ✓ ${fatura.faturaNo} (${fatura.faturaTipi}): ${fatura.kalemler.length} kalem`,
      );
    }
  }

  console.log(`\n3️⃣  Oluşturuldu: ${toplamHareket} stok hareketi`);
  console.log('\n✅ Stok hareketleri fatura miktarlarına göre güncellendi.');
  console.log(
    '   Stok miktarları artık GIRIS/SATIS/CIKIS/IADE hareketlerinden hesaplanacak.\n',
  );
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
