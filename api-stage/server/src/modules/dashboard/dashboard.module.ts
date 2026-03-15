import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { RaporlamaModule } from '../raporlama/raporlama.module';
import { PrismaModule } from '../../common/prisma.module';
import { TenantContextModule } from '../../common/services/tenant-context.module';

@Module({
    imports: [
        RaporlamaModule,
        PrismaModule,
        TenantContextModule,
    ],
    controllers: [DashboardController],
})
export class DashboardModule { }
