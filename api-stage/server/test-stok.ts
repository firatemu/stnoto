import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const fatura = await prisma.fatura.findFirst({ where: { faturaNo: 'SF00027' }, include: { kalemler: true }});
  console.log(JSON.stringify(fatura, null, 2));

  const stokHareket = await prisma.stokHareket.findMany({ where: { aciklama: { contains: 'SF00027' } }});
  console.log('Stok Hareket: ', JSON.stringify(stokHareket, null, 2));
}
check().finally(() => prisma.$disconnect());
