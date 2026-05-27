"use strict";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const cariKodu = "C0005";
    const cari = await prisma.cari.findFirst({
        where: { cariKodu },
        include: {
            hareketler: {
                orderBy: [
                    { tarih: 'asc' },
                    { createdAt: 'asc' }
                ]
            }
        }
    });

    if (!cari) {
        console.log(`Cari ${cariKodu} bulunamadı.`);
        return;
    }

    console.log(`Cari: [${cari.cariKodu}] ${cari.unvan}`);
    console.log(`Mevcut Kart Bakiyesi: ${cari.bakiye}`);
    console.log('--------------------------------------------------');
    console.log('Hareket Listesi:');

    let runningBakiye = 0;
    cari.hareketler.forEach((h, index) => {
        if (h.tip === 'BORC') runningBakiye += Number(h.tutar);
        else if (h.tip === 'ALACAK') runningBakiye -= Number(h.tutar);
        else if (h.tip === 'DEVIR') runningBakiye = Number(h.tutar);

        console.log(`${index + 1}. [${h.tarih.toISOString().split('T')[0]}] ${h.tip} - Tutar: ${h.tutar} - Bakiye: ${h.bakiye} (Hesaplanan: ${runningBakiye}) - Belge: ${h.belgeTipi} No: ${h.belgeNo} - Açıklama: ${h.aciklama}`);
    });
    console.log('--------------------------------------------------');
    console.log(`Son Hesaplanan Bakiye: ${runningBakiye}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
