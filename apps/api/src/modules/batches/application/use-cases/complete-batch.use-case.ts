import {
  AuditAction,
  AuditEntityType,
  AuditLogWriter,
} from '../../../../shared/application/ports/audit-log-writer';
import { Clock } from '../../../../shared/application/ports/clock';
import { TransactionRunner } from '../../../../shared/application/ports/transaction-runner';
import { Batch } from '../../domain/entities/batch';
import { BatchNotFoundError } from '../errors/batch-not-found.error';
import { BatchRepository } from '../ports/batch.repository';

// Batch has no status column — state is derived from completedAt.
const BATCH_STATE_OPEN = 'OPEN';
const BATCH_STATE_COMPLETED = 'COMPLETED';

export class CompleteBatchUseCase {
  constructor(
    private readonly batches: BatchRepository,
    private readonly audit: AuditLogWriter,
    private readonly clock: Clock,
    private readonly transactions: TransactionRunner,
  ) {}

  async execute(id: string): Promise<Batch> {
    const batch = await this.batches.findById(id);
    if (batch === null) {
      throw BatchNotFoundError.byId(id);
    }

    return this.transactions.run(async () => {
      // Domain rejects completing an already-completed batch.
      const updated = await this.batches.update(batch.complete(this.clock.now()));
      await this.audit.record({
        action: AuditAction.STATUS_CHANGE,
        entityType: AuditEntityType.BATCH,
        entityId: updated.id,
        userId: null,
        metadata: { from: BATCH_STATE_OPEN, to: BATCH_STATE_COMPLETED },
      });
      return updated;
    });
  }
}
