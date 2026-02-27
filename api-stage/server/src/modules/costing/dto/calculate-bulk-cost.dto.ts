import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class CalculateBulkCostDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(2000, { message: 'En fazla 2000 stok aynı anda hesaplanabilir.' })
  stokIds!: string[];
}
