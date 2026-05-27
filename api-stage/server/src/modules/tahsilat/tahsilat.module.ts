import { Module } from '@nestjs/common';
import { TahsilatService } from './tahsilat.service';
import { TahsilatExportService } from './tahsilat-export.service';
import { TahsilatController } from './tahsilat.controller';
import { PrismaService } from '../../common/prisma.service';
import { TenantContextModule } from '../../common/services/tenant-context.module';
import { CodeTemplateModule } from '../code-template/code-template.module';

@Module({
  imports: [TenantContextModule, CodeTemplateModule],
  controllers: [TahsilatController],
  providers: [TahsilatService, TahsilatExportService, PrismaService],
  exports: [TahsilatService],
})
export class TahsilatModule { }
