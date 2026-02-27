import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateCompanyVehicleDto } from './dto/create-company-vehicle.dto';
import { UpdateCompanyVehicleDto } from './dto/update-company-vehicle.dto';
import { TenantResolverService } from '../../common/services/tenant-resolver.service';

@Injectable()
export class CompanyVehiclesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly tenantResolver: TenantResolverService,
    ) { }

    async create(createDto: CreateCompanyVehicleDto) {
        const tenantId = await this.tenantResolver.resolveForCreate();
        return this.prisma.extended.companyVehicle.create({
            data: {
                ...createDto,
                tenantId,
            },
        });
    }

    async findAll() {
        const tenantId = await this.tenantResolver.resolveForQuery();
        return this.prisma.extended.companyVehicle.findMany({
            where: { tenantId },
            include: {
                personel: true,
                expenses: {
                    orderBy: { tarih: 'desc' },
                },
            },
        });
    }

    async findOne(id: string) {
        const tenantId = await this.tenantResolver.resolveForQuery();
        const vehicle = await this.prisma.extended.companyVehicle.findFirst({
            where: { id, tenantId },
            include: {
                personel: true,
                expenses: {
                    orderBy: { tarih: 'desc' },
                },
            },
        });

        if (!vehicle) {
            throw new NotFoundException(`Arac id ${id} ile bulunamadi`);
        }

        return vehicle;
    }

    async update(id: string, updateDto: UpdateCompanyVehicleDto) {
        await this.findOne(id); // Ensure it exists and belongs to the tenant

        return this.prisma.extended.companyVehicle.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.extended.companyVehicle.delete({
            where: { id },
        });
    }
}
