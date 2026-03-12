import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const stok = await prisma.stok.findFirst({ where: { stokKodu: 'TGA0307' }});
  console.log('Stok:', stok);
  
  const kalemler = await prisma.faturaKalemi.findMany({ 
    where: { stokId: stok?.id },
    include: { fatura: true }
  });
  console.log('Faturalar:');
  for (const k of kalemler) {
      console.log(`Fatura No: ${k.fatura.faturaNo}, Durum: ${k.fatura.durum}, Miktar: ${k.miktar}`);
  }

  const hareketler = await prisma.stokHareket.findMany({
      where: { stokId: stok?.id }
  });
  console.log('Hareketler:', hareketler.map(h => ({ aciklama: h.aciklama, miktar: h.miktar, tipi: h.hareketTipi })));
}
check().finally(() => prisma.$disconnect());
