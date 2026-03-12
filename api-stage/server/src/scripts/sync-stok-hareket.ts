import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Tüm faturalar ile stok hareketleri (Malzeme Hareketleri) tam senkronize ediliyor...');

    // 1. Önce faturalara ait tüm mevcut stok hareketlerini silelim (Temiz sayfa)
    const silinecekHareketler = await prisma.stokHareket.findMany({
        where: {
            OR: [
                { aciklama: { contains: 'Faturası' } },
                { aciklama: { contains: 'Güncelleme' } },
                { faturaKalemiId: { not: null } }
            ]
        }
    });

    if (silinecekHareketler.length > 0) {
        console.log(`🧹 Toplam ${silinecekHareketler.length} adet eski fatura kaynaklı stok hareketi siliniyor...`);
        await prisma.stokHareket.deleteMany({
            where: {
                id: { in: silinecekHareketler.map(h => h.id) }
            }
        });
    }

    // 2. Onaylanmış tüm faturaları kalemleriyle birlikte al
    const faturalar = await prisma.fatura.findMany({
        where: {
            durum: 'ONAYLANDI',
            deletedAt: null // Soft delete olmayanlar
        },
        include: {
            kalemler: true
        }
    });

    console.log(`🔍 Toplam ${faturalar.length} adet ONAYLI fatura bulundu, hareketler yeniden oluşturuluyor...`);

    let yeniEklenen = 0;

    for (const fatura of faturalar) {
        for (const kalem of fatura.kalemler) {
            const isSatis = fatura.faturaTipi === 'SATIS';

            await prisma.stokHareket.create({
                data: {
                    stokId: kalem.stokId,
                    hareketTipi: isSatis ? 'SATIS' : 'GIRIS',
                    miktar: kalem.miktar,
                    birimFiyat: kalem.birimFiyat,
                    aciklama: `${isSatis ? 'Satış' : 'Alış'} Faturası: ${fatura.faturaNo}`,
                    faturaKalemiId: kalem.id,
                    tenantId: fatura.tenantId,
                    warehouseId: fatura.warehouseId
                }
            });

            yeniEklenen++;
        }
    }

    console.log(`✅ İşlem başarıyla tamamlandı. Yeniden oluşturulan stok hareketi sayısı: ${yeniEklenen}`);
}

main()
    .catch((e) => {
        console.error('Kritik Hata:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
