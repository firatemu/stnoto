import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Hatalı stok hareketleri (faturaKalemiId eksik olanlar) bulunuyor...');

  const hataliHareketler = await prisma.stokHareket.findMany({
    where: {
      faturaKalemiId: null,
      aciklama: { contains: 'Faturası' }
    }
  });

  console.log(`📊 Toplam ${hataliHareketler.length} adet eksik ilişkili hareket bulundu.`);

  let duzeltilen = 0;
  let silinen = 0;

  for (const hareket of hataliHareketler) {
    const isGuncelleme = hareket.aciklama?.includes('Güncelleme:');
    
    // Açıklamadan fatura nosunu al (Örn: "Satış Faturası Güncelleme: SF00026")
    const match = hareket.aciklama?.match(/(?:Faturası|Güncelleme:)\s*([^\s]+)$/);
    if (!match || !match[1]) continue;
    
    const faturaNo = match[1];

    // İlgili faturayı bul
    const fatura = await prisma.fatura.findFirst({
        where: { faturaNo },
        include: { kalemler: true }
    });

    if (!fatura) continue;

    // Fatura kalemini bul (stokId ve miktar eşleşen)
    const kalem = fatura.kalemler.find(k => k.stokId === hareket.stokId && Number(k.miktar) === Number(hareket.miktar));

    if (kalem) {
        // Düzelt
        await prisma.stokHareket.update({
            where: { id: hareket.id },
            data: {
                faturaKalemiId: kalem.id,
                tenantId: fatura.tenantId,
                warehouseId: fatura.warehouseId,
                aciklama: `${fatura.faturaTipi === 'SATIS' ? 'Satış' : 'Alış'} Faturası: ${fatura.faturaNo}`
            }
        });
        duzeltilen++;
    } else {
        // Eğer faturada artık böyle bir kalem yoksa, bu hareket ölüdür, sil
        await prisma.stokHareket.delete({ where: { id: hareket.id }});
        silinen++;
    }
  }

  console.log(`✅ İşlem tamamlandı. Düzeltilen: ${duzeltilen}, Silinen: ${silinen}`);
}

main()
  .catch((e) => {
    console.error('Kritik Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
