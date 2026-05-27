import { HareketTipi } from '@prisma/client';

/** Fatura kalemi üzerinden iptal edilmiş belgelere ait hareketler stok hesabına dahil edilmez */
export type StokHareketMiktarInput = {
  hareketTipi: HareketTipi;
  miktar: number;
  faturaKalemi?: { fatura?: { durum?: string | null } | null } | null;
};

/**
 * Malzeme stok miktarı = tüm onaylı (iptal fatura dışı) stok hareketlerinin işaretli toplamı.
 * Depo/raf stoku (product_location_stocks) ile çelişirse kaynak: bu hesap.
 */
export function computeMiktarFromStokHareketler(
  rows: StokHareketMiktarInput[],
): number {
  let miktar = 0;
  for (const hareket of rows) {
    if (hareket.faturaKalemi?.fatura?.durum === 'IPTAL') {
      continue;
    }
    const t = hareket.hareketTipi;
    if (
      t === HareketTipi.GIRIS ||
      t === HareketTipi.SAYIM_FAZLA ||
      t === HareketTipi.IADE ||
      t === HareketTipi.IPTAL_GIRIS
    ) {
      miktar += hareket.miktar;
    } else if (
      t === HareketTipi.CIKIS ||
      t === HareketTipi.SATIS ||
      t === HareketTipi.SAYIM_EKSIK ||
      t === HareketTipi.IPTAL_CIKIS
    ) {
      miktar -= hareket.miktar;
    }
    // SAYIM (ham): eski veri; FAZLA/EKSIK kullanılmalı — nete katılmaz
  }
  return miktar;
}
