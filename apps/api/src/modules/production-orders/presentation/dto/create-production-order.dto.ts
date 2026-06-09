import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateProductionOrderDto {
  @IsString()
  @MinLength(1)
  reference!: string;

  @IsInt()
  @Min(1)
  targetQuantity!: number;

  @IsString()
  @MinLength(1)
  machineId!: string;
}
