import { QualityCheck } from '../../domain/entities/quality-check';
import { QualityCheckRepository } from '../ports/quality-check.repository';

export class InMemoryQualityCheckRepository implements QualityCheckRepository {
  private readonly checks = new Map<string, QualityCheck>();

  create(check: QualityCheck): Promise<QualityCheck> {
    this.checks.set(check.id, check);
    return Promise.resolve(check);
  }

  findByBatchId(batchId: string): Promise<QualityCheck[]> {
    const found = [...this.checks.values()].filter((check) => check.batchId === batchId);
    return Promise.resolve(found);
  }
}
