import { IsString, MinLength } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  @MinLength(1)
  productionOrderId!: string;
}
