import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString, IsUUID } from 'class-validator';

export class CreateCompanyVehicleDto {
    @IsString()
    plaka: string;

    @IsString()
    marka: string;

    @IsString()
    model: string;

    @IsNumber()
    @IsOptional()
    yil?: number;

    @IsString()
    @IsOptional()
    saseno?: string;

    @IsString()
    @IsOptional()
    motorNo?: string;

    @IsDateString()
    @IsOptional()
    tescilTarihi?: string;

    @IsString()
    @IsOptional()
    aracTipi?: string;

    @IsString()
    @IsOptional()
    yakitTipi?: string;

    @IsBoolean()
    @IsOptional()
    durum?: boolean;

    @IsUUID()
    @IsOptional()
    zimmetliPersonelId?: string;

    @IsString()
    @IsOptional()
    ruhsatGorselUrl?: string;

    @IsString()
    @IsOptional()
    notlar?: string;
}
