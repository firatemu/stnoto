import { IsString, IsOptional, IsNumber, IsDateString, IsUUID, IsEnum, Min } from 'class-validator';
import { VehicleExpenseType } from '@prisma/client';

export class CreateVehicleExpenseDto {
    @IsUUID()
    vehicleId: string;

    @IsEnum(VehicleExpenseType)
    masrafTipi: VehicleExpenseType;

    @IsDateString()
    @IsOptional()
    tarih?: string;

    @IsNumber()
    @Min(0)
    tutar: number;

    @IsString()
    @IsOptional()
    aciklama?: string;

    @IsString()
    @IsOptional()
    belgeNo?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    kilometre?: number;
}
