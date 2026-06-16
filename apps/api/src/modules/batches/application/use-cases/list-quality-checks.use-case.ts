import { QualityCheck } from '../../domain/entities/quality-check';
import { QualityCheckRepository } from '../ports/quality-check.repository';

export class ListQualityChecksUseCase {
  constructor(private readonly checks: QualityCheckRepository) {}

  execute(batchId: string): Promise<QualityCheck[]> {
    return this.checks.findByBatchId(batchId);
  }
}
