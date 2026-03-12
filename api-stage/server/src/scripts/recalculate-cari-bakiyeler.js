"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🔄 Tüm carilerin yürüyen bakiyeleri yeniden hesaplanıyor...');
    const cariler = await prisma.cari.findMany({ select: { id: true, unvan: true, cariKodu: true } });
    console.log(`📊 Toplam ${cariler.length} adet cari hesap bulundu.`);
    let basarili = 0;
    let hatali = 0;
    for (const cari of cariler) {
        try {
            const hareketler = await prisma.cariHareket.findMany({
                where: { cariId: cari.id },
                orderBy: [
                    { tarih: 'asc' },
                    { createdAt: 'asc' },
                ]
            });
            let runningBakiye = 0;
            for (const hareket of hareketler) {
                if (hareket.tip === 'BORC') {
                    runningBakiye += Number(hareket.tutar);
                }
                else if (hareket.tip === 'ALACAK') {
                    runningBakiye -= Number(hareket.tutar);
                }
                else if (hareket.tip === 'DEVIR') {
                    runningBakiye = Number(hareket.tutar);
                }
                await prisma.cariHareket.update({
                    where: { id: hareket.id },
                    data: { bakiye: runningBakiye }
                });
            }
            await prisma.cari.update({
                where: { id: cari.id },
                data: { bakiye: runningBakiye }
            });
            console.log(`✅ [${cari.cariKodu}] ${cari.unvan} : Bakiye ${runningBakiye} olarak güncellendi.`);
            basarili++;
        }
        catch (error) {
            console.error(`❌ [${cari.cariKodu}] ${cari.unvan} : Hata oluştu!`, error);
            hatali++;
        }
    }
    console.log('--------------------------------------------------');
    console.log(`🏁 İşlem tamamlandı! Başarılı: ${basarili}, Hatalı: ${hatali}`);
}
main()
    .catch((e) => {
    console.error('Kritik Hata:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
