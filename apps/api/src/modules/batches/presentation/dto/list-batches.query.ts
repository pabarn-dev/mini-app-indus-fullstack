import { IsString, MinLength } from 'class-validator';

export class ListBatchesQuery {
  @IsString()
  @MinLength(1)
  productionOrderId!: string;
}
