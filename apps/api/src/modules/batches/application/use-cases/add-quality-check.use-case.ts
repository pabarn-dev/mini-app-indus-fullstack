import {
  AuditAction,
  AuditEntityType,
  AuditLogWriter,
} from '../../../../shared/application/ports/audit-log-writer';
import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { TransactionRunner } from '../../../../shared/application/ports/transaction-runner';
import { QualityCheck } from '../../domain/entities/quality-check';
import { BatchNotFoundError } from '../errors/batch-not-found.error';
import { BatchRepository } from '../ports/batch.repository';
import { QualityCheckRepository } from '../ports/quality-check.repository';

export interface AddQualityCheckInput {
  readonly batchId: string;
  readonly result: string;
  readonly notes?: string | null | undefined;
}

export class AddQualityCheckUseCase {
  constructor(
    private readonly batches: BatchRepository,
    private readonly checks: QualityCheckRepository,
    private readonly audit: AuditLogWriter,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
    private readonly transactions: TransactionRunner,
  ) {}

  async execute(input: AddQualityCheckInput): Promise<QualityCheck> {
    const batch = await this.batches.findById(input.batchId);
    if (batch === null) {
      throw BatchNotFoundError.byId(input.batchId);
    }

    // Domain validates the result (PASSED | WARNING | FAILED) and normalizes notes.
    const check = QualityCheck.create({
      id: this.idGenerator.generate(),
      batchId: batch.id,
      result: input.result,
      notes: input.notes,
      checkedById: null, // no auth yet (Phase 6)
      createdAt: this.clock.now(),
    });

    return this.transactions.run(async () => {
      const created = await this.checks.create(check);
      await this.audit.record({
        action: AuditAction.CREATE,
        entityType: AuditEntityType.QUALITY_CHECK,
        entityId: created.id,
        userId: null,
        metadata: { batchId: created.batchId, result: created.result },
      });
      return created;
    });
  }
}
