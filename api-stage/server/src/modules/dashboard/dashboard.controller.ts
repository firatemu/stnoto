import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RaporlamaService } from '../raporlama/raporlama.service';
import { PrismaService } from '../../common/prisma.service';
import { TenantResolverService } from '../../common/services/tenant-resolver.service';
import { buildTenantWhereClause } from '../../common/utils/staging.util';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
    constructor(
        private readonly raporlamaService: RaporlamaService,
        private readonly prisma: PrismaService,
        private readonly tenantResolver: TenantResolverService,
    ) { }

    @Get('stats')
    async getDashboardStats() {
        try {
            const tenantId = await this.tenantResolver.resolveForQuery();
            const tenantWhere = buildTenantWhereClause(tenantId ?? undefined);

            // Get overview from raporlama service for financial data
            const overview = await this.raporlamaService.getOverview({ preset: 'thisMonth' });

            // Count stocks and caris
            const [toplamStok, cariSayisi] = await Promise.all([
                this.prisma.stok.count({
                    where: {
                        ...tenantWhere,
                        deletedAt: null,
                    },
                }),
                this.prisma.cari.count({
                    where: {
                        ...tenantWhere,
                        deletedAt: null,
                    },
                }),
            ]);

            const totalSales = overview.financialSummary?.totalSales || 0;
            const grossProfit = overview.financialSummary?.grossProfit || 0;
            const karMarji = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

            return {
                toplamStok,
                cariSayisi,
                aylikSatis: totalSales,
                karMarji: Math.round(karMarji * 100) / 100, // 2 decimal places
            };
        } catch (error) {
            console.error('Dashboard stats error:', error);
            throw error; // Let NestJS handle it but log it first
        }
    }
}
