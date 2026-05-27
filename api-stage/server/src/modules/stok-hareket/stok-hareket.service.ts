import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { HareketTipi, Prisma } from '@prisma/client';

@Injectable()
export class StokHareketService {
  constructor(private prisma: PrismaService) { }

  async findAll(
    page = 1,
    limit = 100,
    stokId?: string,
    hareketTipi?: HareketTipi,
    tenantId?: string,
  ) {
    const skip = (page - 1) * limit;

    // Eski kayıtlar: tenant_id NULL olabilir; stok.tenant_id ile kiracıya bağlıdır.
    const parts: Prisma.StokHareketWhereInput[] = [];
    if (stokId) {
      parts.push({ stokId });
    }
    if (hareketTipi) {
      parts.push({ hareketTipi });
    }
    if (tenantId) {
      parts.push({
        OR: [{ tenantId }, { tenantId: null, stok: { tenantId } }],
      });
    }

    const where: Prisma.StokHareketWhereInput =
      parts.length === 0 ? {} : parts.length === 1 ? parts[0]! : { AND: parts };

    const [data, total] = await Promise.all([
      this.prisma.stokHareket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          stok: {
            select: {
              id: true,
              stokKodu: true,
              stokAdi: true,
              marka: true,
              birim: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          faturaKalemi: {
            select: {
              id: true,
              birimFiyat: true,
              iskontoOrani: true,
              iskontoTutari: true,
              tutar: true,
              fatura: {
                select: {
                  faturaNo: true,
                  faturaTipi: true,
                  durum: true,
                  cari: {
                    select: {
                      unvan: true,
                      cariKodu: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.stokHareket.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
