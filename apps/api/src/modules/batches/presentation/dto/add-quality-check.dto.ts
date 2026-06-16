import { IsIn, IsOptional, IsString } from 'class-validator';

const QUALITY_CHECK_RESULTS = ['PASSED', 'WARNING', 'FAILED'] as const;

export class AddQualityCheckDto {
  @IsIn(QUALITY_CHECK_RESULTS)
  result!: (typeof QUALITY_CHECK_RESULTS)[number];

  @IsOptional()
  @IsString()
  notes?: string;
}
