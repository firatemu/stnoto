import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateVehicleExpenseDto } from './dto/create-vehicle-expense.dto';
import { UpdateVehicleExpenseDto } from './dto/update-vehicle-expense.dto';
import { TenantResolverService } from '../../common/services/tenant-resolver.service';

@Injectable()
export class VehicleExpensesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly tenantResolver: TenantResolverService,
    ) { }

    async create(createDto: CreateVehicleExpenseDto) {
        const tenantId = await this.tenantResolver.resolveForCreate();

        // Check if vehicle exists and belongs to tenant
        const vehicle = await this.prisma.extended.companyVehicle.findFirst({
            where: { id: createDto.vehicleId, tenantId },
        });

        if (!vehicle) {
            throw new NotFoundException(`Arac id ${createDto.vehicleId} ile bulunamadi`);
        }

        return this.prisma.extended.vehicleExpense.create({
            data: {
                ...createDto,
                tenantId,
            },
        });
    }

    async findAll() {
        const tenantId = await this.tenantResolver.resolveForQuery();
        return this.prisma.extended.vehicleExpense.findMany({
            where: { tenantId },
            include: {
                vehicle: true,
            },
            orderBy: {
                tarih: 'desc',
            },
        });
    }

    async findByVehicle(vehicleId: string) {
        const tenantId = await this.tenantResolver.resolveForQuery();
        return this.prisma.extended.vehicleExpense.findMany({
            where: { vehicleId, tenantId },
            orderBy: {
                tarih: 'desc',
            },
        });
    }

    async findOne(id: string) {
        const tenantId = await this.tenantResolver.resolveForQuery();
        const expense = await this.prisma.extended.vehicleExpense.findFirst({
            where: { id, tenantId },
            include: {
                vehicle: true,
            },
        });

        if (!expense) {
            throw new NotFoundException(`Masraf id ${id} ile bulunamadi`);
        }

        return expense;
    }

    async update(id: string, updateDto: UpdateVehicleExpenseDto) {
        await this.findOne(id); // Ensure it exists and belongs to tenant

        return this.prisma.extended.vehicleExpense.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.extended.vehicleExpense.delete({
            where: { id },
        });
    }
}
