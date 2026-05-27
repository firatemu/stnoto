/**
 * fix-duplicate-stok-hareketleri.js
 * 
 * Bu script, "Veri Onarımı: Eksik Stok Hareketi" prefix'li mükerrer stok 
 * hareketlerini tespit eder ve siler. Ardından etkilenen stokların 
 * miktar bilgilerini yeniden hesaplar.
 * 
 * Kullanım: node fix-duplicate-stok-hareketleri.js
 * 
 * Mantık:
 *   - "Veri Onarımı" önekli her kayıt için aynı (stokId, hareketTipi, miktar, faturaKalemiId)
 *     kombinasyonuna sahip orijinal bir kayıt var mı kontrol edilir.
 *   - Alternatif kontrol: aynı fatura kalemi için aynı stokId'ye iki ayrı hareket var mı?
 *   - Mükerrer bulunanlar DELETED olarak işaretlenir ve silinir.
 */

const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'StNoto_2026_Secure!',
    database: 'otomuhasebe',
});

async function main() {
    await client.connect();
    console.log('✅ Veritabanına bağlandı.\n');

    try {
        // ─────────────────────────────────────────────────────────────────────────
        // ADIM 1: Tüm "Veri Onarımı" kayıtlarını getir
        // ─────────────────────────────────────────────────────────────────────────
        const repairRows = await client.query(`
      SELECT 
        sh.id,
        sh."stokId",
        sh."hareketTipi",
        sh.miktar,
        sh.aciklama,
        sh."faturaKalemiId",
        sh."warehouseId",
        sh."tenantId",
        sh."createdAt"
      FROM stok_hareketleri sh
      WHERE sh.aciklama LIKE 'Veri Onarımı: Eksik Stok Hareketi: %'
      ORDER BY sh."createdAt"
    `);

        console.log(`📊 Toplam "Veri Onarımı" kayıt sayısı: ${repairRows.rows.length}`);

        const toDelete = [];         // silinecek "Veri Onarımı" kayıtlarının ID'leri
        const toDeleteDetails = [];  // loglama için
        const affectedStokIds = new Set();

        // ─────────────────────────────────────────────────────────────────────────
        // ADIM 2: Her "Veri Onarımı" kaydı için aynı fatura kalemine (faturaKalemiId)
        // bağlı başka bir orijinal stok hareketi var mı kontrol et
        // ─────────────────────────────────────────────────────────────────────────
        for (const row of repairRows.rows) {
            if (!row.faturaKalemiId) {
                console.log(`⚠️  faturaKalemiId eksik: ${row.id} - ${row.aciklama}`);
                continue;
            }

            // Aynı faturaKalemiId + stokId için "Veri Onarımı" OLMAYAN başka kayıt var mı?
            const originalCheck = await client.query(`
        SELECT id, aciklama, "createdAt"
        FROM stok_hareketleri
        WHERE "faturaKalemiId" = $1
          AND "stokId" = $2
          AND id != $3
          AND aciklama NOT LIKE 'Veri Onarımı:%'
      `, [row.faturaKalemiId, row.stokId, row.id]);

            if (originalCheck.rows.length > 0) {
                // Orijinal kayıt var → bu "Veri Onarımı" kaydı mükerrer, silinecek
                toDelete.push(row.id);
                affectedStokIds.add(row.stokId);
                toDeleteDetails.push({
                    deleteId: row.id,
                    deleteAciklama: row.aciklama,
                    stokId: row.stokId,
                    hareketTipi: row.hareketTipi,
                    miktar: row.miktar,
                    faturaKalemiId: row.faturaKalemiId,
                    originalId: originalCheck.rows[0].id,
                    originalAciklama: originalCheck.rows[0].aciklama,
                });
            } else {
                // Orijinal kayıt yok → "Veri Onarımı" kaydı geçerli, silinmeyecek
                // (Bu fatura kaleminin hareketi sadece onarım kaydıyla oluşmuş)
            }
        }

        console.log(`\n🗑️  Mükerrer (silinecek) kayıt sayısı: ${toDelete.length}`);
        console.log(`📦 Etkilenen stok sayısı: ${affectedStokIds.size}\n`);

        if (toDeleteDetails.length > 0) {
            console.log('--- Silinecek Kayıtların Detayı ---');
            for (const d of toDeleteDetails) {
                console.log(`  SĐLINECEK: ${d.deleteId}`);
                console.log(`    Açıklama  : ${d.deleteAciklama}`);
                console.log(`    StokId    : ${d.stokId}`);
                console.log(`    Hareket   : ${d.hareketTipi} x${d.miktar}`);
                console.log(`    FK Kalemi : ${d.faturaKalemiId}`);
                console.log(`    Orijinal  : ${d.originalId} (${d.originalAciklama})`);
                console.log('');
            }
        }

        if (toDelete.length === 0) {
            console.log('✅ Silinecek mükerrer kayıt bulunamadı. Veritabanı temiz!');
            await client.end();
            return;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // ADIM 3: Silme işlemi (transaction içinde)
        // ─────────────────────────────────────────────────────────────────────────
        await client.query('BEGIN');

        try {
            const deleteResult = await client.query(`
        DELETE FROM stok_hareketleri
        WHERE id = ANY($1::text[])
      `, [toDelete]);

            console.log(`✅ ${deleteResult.rowCount} mükerrer kayıt silindi.\n`);

            // ─────────────────────────────────────────────────────────────────────
            // ADIM 4: Etkilenen stokların miktar bilgilerini yeniden hesapla
            // ─────────────────────────────────────────────────────────────────────
            console.log('🔄 Etkilenen stokların miktarları yeniden hesaplanıyor...\n');

            const affectedStokIdList = Array.from(affectedStokIds);
            let updatedCount = 0;

            for (const stokId of affectedStokIdList) {
                // Her (stokId, warehouseId) kombinasyonu için yeni miktarı hesapla
                const calcResult = await client.query(`
          SELECT 
            "warehouseId",
            SUM(CASE WHEN "hareketTipi" IN ('GIRIS', 'IADE') THEN miktar ELSE 0 END) -
            SUM(CASE WHEN "hareketTipi" IN ('SATIS', 'CIKIS') THEN miktar ELSE 0 END) AS calculated_qty
          FROM stok_hareketleri
          WHERE "stokId" = $1
          GROUP BY "warehouseId"
        `, [stokId]);

                for (const calc of calcResult.rows) {
                    const warehouseId = calc.warehouseId;
                    const newQty = parseInt(calc.calculated_qty) || 0;

                    if (warehouseId === null) {
                        // warehouseId olmayan hareketler – product_location_stocks güncellenmez
                        continue;
                    }

                    // Mevcut product_location_stocks kaydını bul
                    const existing = await client.query(`
            SELECT id, "qtyOnHand"
            FROM product_location_stocks
            WHERE "productId" = $1 AND "warehouseId" = $2
          `, [stokId, warehouseId]);

                    if (existing.rows.length > 0) {
                        const oldQty = existing.rows[0].qtyOnHand;
                        if (oldQty !== newQty) {
                            await client.query(`
                UPDATE product_location_stocks
                SET "qtyOnHand" = $1, "updatedAt" = NOW()
                WHERE "productId" = $2 AND "warehouseId" = $3
              `, [newQty, stokId, warehouseId]);
                            console.log(`  📦 StokId=${stokId} | Warehouse=${warehouseId} | ${oldQty} → ${newQty}`);
                            updatedCount++;
                        } else {
                            console.log(`  ✅ StokId=${stokId} | Warehouse=${warehouseId} | Miktar zaten doğru: ${newQty}`);
                        }
                    } else {
                        console.log(`  ⚠️  StokId=${stokId} | Warehouse=${warehouseId} | product_location_stocks kaydı bulunamadı!`);
                    }
                }
            }

            await client.query('COMMIT');
            console.log(`\n✅ İşlem tamamlandı!`);
            console.log(`   Silinen mükerrer kayıt  : ${deleteResult.rowCount}`);
            console.log(`   Güncellenen stok miktarı: ${updatedCount}`);

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('❌ Hata oluştu, ROLLBACK yapıldı:', err.message);
            throw err;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // ADIM 5: Doğrulama – 2541701002 stok kodlu ürünü kontrol et
        // ─────────────────────────────────────────────────────────────────────────
        console.log('\n🔍 Doğrulama: 2541701002 stok kodunun SF00044 hareketleri:');
        const verifyResult = await client.query(`
      SELECT sh.id, sh."hareketTipi", sh.miktar, sh.aciklama, sh."createdAt", sh."faturaKalemiId"
      FROM stok_hareketleri sh
      JOIN stoklar s ON sh."stokId" = s.id
      WHERE s."stokKodu" = '2541701002'
        AND sh.aciklama LIKE '%SF00044%'
      ORDER BY sh."createdAt"
    `);

        if (verifyResult.rows.length === 0) {
            console.log('  ⚠️  SF00044\'e ait hiç hareket kalmadı!');
        } else {
            for (const r of verifyResult.rows) {
                console.log(`  ✅ ${r.id} | ${r.hareketTipi} x${r.miktar} | ${r.aciklama}`);
            }
        }

    } finally {
        await client.end();
        console.log('\nBağlantı kapatıldı.');
    }
}

main().catch(err => {
    console.error('Script hatası:', err);
    process.exit(1);
});
