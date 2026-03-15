import { Module } from '@nestjs/common';
import { RaporlamaController } from './raporlama.controller';
import { RaporlamaService } from './raporlama.service';
import { PrismaModule } from '../../common/prisma.module';
import { TenantContextModule } from '../../common/services/tenant-context.module';

@Module({
  imports: [PrismaModule, TenantContextModule],
  controllers: [RaporlamaController],
  providers: [RaporlamaService],
  exports: [RaporlamaService],
})
export class RaporlamaModule { }
