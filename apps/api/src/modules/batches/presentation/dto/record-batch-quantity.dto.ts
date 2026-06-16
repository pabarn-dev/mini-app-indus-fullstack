import { IsInt, Min } from 'class-validator';

export class RecordBatchQuantityDto {
  @IsInt()
  @Min(0)
  quantity!: number;
}
