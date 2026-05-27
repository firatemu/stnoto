const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const rs = await prisma.stokHareket.findMany({
        where: { aciklama: { contains: 'SF00030' } }
    });
    console.log('StokHareketler:', rs);
}
main().finally(() => prisma.$disconnect());
