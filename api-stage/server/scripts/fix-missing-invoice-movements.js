const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting sync for missing invoice stock and cari movements...');

    const invoices = await prisma.fatura.findMany({
        where: {
            durum: { in: ['KAPALI', 'KISMEN_ODENDI'] },
            deletedAt: null
        },
        include: {
            kalemler: {
                include: {
                    stokHareketleri: true
                }
            },
            cari: true
        }
    });

    let totalFixedStock = 0;
    let totalFixedCari = 0;

    for (const fatura of invoices) {
        if (!fatura.kalemler || fatura.kalemler.length === 0) continue;

        const isSatis = fatura.faturaTipi === 'SATIS';
        const hasMissingStock = fatura.kalemler.some(k => !k.stokHareketleri || k.stokHareketleri.length === 0);

        const existingCariHareket = await prisma.cariHareket.findFirst({
            where: { belgeNo: fatura.faturaNo, belgeTipi: 'FATURA' }
        });
        const hasMissingCari = !existingCariHareket;

        if (hasMissingStock || hasMissingCari) {
            console.log(`Processing Fatura: ${fatura.faturaNo} (ID: ${fatura.id}, Tip: ${fatura.faturaTipi}, Durum: ${fatura.durum})`);

            await prisma.$transaction(async (tx) => {
                if (hasMissingCari && fatura.cari) {
                    const cariInfo = await tx.cari.findUnique({ where: { id: fatura.cariId } });
                    let currentBakiye = Number(cariInfo?.bakiye || 0);
                    const islemTutari = Number(fatura.genelToplam);

                    if (isSatis) currentBakiye += islemTutari;
                    else currentBakiye -= islemTutari;

                    await tx.cariHareket.create({
                        data: {
                            cariId: fatura.cariId,
                            tip: isSatis ? 'BORC' : 'ALACAK',
                            tutar: fatura.genelToplam,
                            bakiye: currentBakiye,
                            belgeTipi: 'FATURA',
                            belgeNo: fatura.faturaNo,
                            tarih: fatura.tarih || new Date(),
                            aciklama: `Veri Onarımı: Eksik ${isSatis ? 'Satış' : 'Alış'} Fatura Hareketi: ${fatura.faturaNo}`,
                            tenantId: fatura.tenantId
                        }
                    });

                    await tx.cari.update({
                        where: { id: fatura.cariId },
                        data: { bakiye: currentBakiye }
                    });
                    totalFixedCari++;
                    console.log(`  - Added missing CariHareket for ${fatura.faturaNo}`);
                }

                if (hasMissingStock) {
                    for (const kalem of fatura.kalemler) {
                        if (!kalem.stokHareketleri || kalem.stokHareketleri.length === 0) {
                            await tx.stokHareket.create({
                                data: {
                                    stokId: kalem.stokId,
                                    hareketTipi: isSatis ? 'SATIS' : 'GIRIS',
                                    miktar: kalem.miktar,
                                    birimFiyat: kalem.birimFiyat,
                                    aciklama: `Veri Onarımı: Eksik Stok Hareketi: ${fatura.faturaNo}`,
                                    faturaKalemiId: kalem.id,
                                    tenantId: fatura.tenantId || undefined,
                                    warehouseId: fatura.warehouseId,
                                },
                            });
                            totalFixedStock++;
                        }
                    }
                    console.log(`  - Added missing StokHareket for ${fatura.faturaNo}`);
                }
            });
        }
    }

    console.log(`Sync completed! Fixed ${totalFixedCari} Cari movements and ${totalFixedStock} Stok movements.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
