/**
 * SF-2026-001 numaralı satış faturasındaki tüm kalemlerin KDV oranını 0 yapar.
 * Kullanım: npx ts-node -r tsconfig-paths/register scripts/set-fatura-kalem-kdv-zero.ts
 * veya: cd api-stage/server && npx ts-node -r tsconfig-paths/register scripts/set-fatura-kalem-kdv-zero.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FATURA_NO = 'SF-2026-001';

async function main() {
  const fatura = await prisma.fatura.findFirst({
    where: { faturaNo: FATURA_NO, deletedAt: null },
    include: { kalemler: true },
  });

  if (!fatura) {
    console.error(`Fatura bulunamadı: ${FATURA_NO}`);
    process.exit(1);
  }

  console.log(`Fatura: ${fatura.faturaNo} (id: ${fatura.id}), kalem sayısı: ${fatura.kalemler.length}`);

  let toplamTutar = 0;

  for (const kalem of fatura.kalemler) {
    const tutarNum = Number(kalem.tutar);
    toplamTutar += tutarNum;

    await prisma.faturaKalemi.update({
      where: { id: kalem.id },
      data: {
        kdvOrani: 0,
        kdvTutar: 0,
      },
    });
    console.log(`  Kalem ${kalem.id}: kdvOrani → 0, kdvTutar → 0`);
  }

  const kdvTutar = 0;
  const genelToplam = toplamTutar + kdvTutar;

  await prisma.fatura.update({
    where: { id: fatura.id },
    data: {
      kdvTutar: 0,
      genelToplam,
    },
  });

  console.log(`\n✅ Fatura güncellendi: toplamTutar=${toplamTutar.toFixed(2)}, kdvTutar=0, genelToplam=${genelToplam.toFixed(2)}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
