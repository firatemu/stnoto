import { Module } from '@nestjs/common';
import { TahsilatService } from './tahsilat.service';
import { TahsilatExportService } from './tahsilat-export.service';
import { TahsilatController } from './tahsilat.controller';
import { PrismaService } from '../../common/prisma.service';
import { TenantContextModule } from '../../common/services/tenant-context.module';

@Module({
  imports: [TenantContextModule],
  controllers: [TahsilatController],
  providers: [TahsilatService, TahsilatExportService, PrismaService],
  exports: [TahsilatService],
})
export class TahsilatModule { }
