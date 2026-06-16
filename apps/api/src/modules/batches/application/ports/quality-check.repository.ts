import { QualityCheck } from '../../domain/entities/quality-check';

export interface QualityCheckRepository {
  create(check: QualityCheck): Promise<QualityCheck>;
  findByBatchId(batchId: string): Promise<QualityCheck[]>;
}

export const QUALITY_CHECK_REPOSITORY = Symbol('QualityCheckRepository');
