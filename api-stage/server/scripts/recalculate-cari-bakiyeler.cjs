/**
 * Tüm cariler: bakiye = cari_hareketler üzerinden tarih sırasıyla yürüyen toplam.
 * BORC: +tutar, ALACAK: -tutar, DEVIR: bakiyeyi tutara sıfırlar (FaturaService.recalculateCariBakiyeler ile aynı).
 *
 * Kullanım: node scripts/recalculate-cari-bakiyeler.cjs
 * Tek kiracı: TENANT_ID=uuid node scripts/recalculate-cari-bakiyeler.cjs
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const tenantId = process.env.TENANT_ID?.trim() || null;
  console.log(
    tenantId
      ? `Cari bakiyeleri yeniden hesaplanıyor (tenantId=${tenantId})...`
      : 'Tüm carilerin bakiyeleri cari hareketlerine göre yeniden hesaplanıyor...',
  );
  const cariler = await prisma.cari.findMany({
    where: tenantId ? { tenantId } : undefined,
    select: { id: true, cariKodu: true, unvan: true },
  });
  console.log(`Toplam ${cariler.length} cari.`);

  let basarili = 0;
  let hatali = 0;

  for (const cari of cariler) {
    try {
      const hareketler = await prisma.cariHareket.findMany({
        where: { cariId: cari.id },
        orderBy: [{ tarih: 'asc' }, { createdAt: 'asc' }],
      });

      let runningBakiye = 0;

      for (const hareket of hareketler) {
        if (hareket.tip === 'BORC') {
          runningBakiye += Number(hareket.tutar);
        } else if (hareket.tip === 'ALACAK') {
          runningBakiye -= Number(hareket.tutar);
        } else if (hareket.tip === 'DEVIR') {
          runningBakiye = Number(hareket.tutar);
        }

        await prisma.cariHareket.update({
          where: { id: hareket.id },
          data: { bakiye: runningBakiye },
        });
      }

      await prisma.cari.update({
        where: { id: cari.id },
        data: { bakiye: runningBakiye },
      });

      basarili++;
    } catch (error) {
      console.error(`Hata [${cari.cariKodu}] ${cari.unvan}:`, error.message);
      hatali++;
    }
  }

  console.log('---');
  console.log(`Tamamlandı. Güncellenen: ${basarili}, Hata: ${hatali}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
