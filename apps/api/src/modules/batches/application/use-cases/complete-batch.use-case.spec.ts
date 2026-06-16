import { beforeEach, describe, expect, it } from 'vitest';
import {
  AuditAction,
  AuditEntityType,
} from '../../../../shared/application/ports/audit-log-writer';
import { Batch } from '../../domain/entities/batch';
import { BatchAlreadyCompletedError } from '../../domain/errors/batch-already-completed.error';
import { BatchNotFoundError } from '../errors/batch-not-found.error';
import { FixedClock } from '../testing/fakes';
import { ImmediateTransactionRunner } from '../testing/immediate-transaction-runner';
import { InMemoryAuditLogWriter } from '../testing/in-memory-audit-log-writer';
import { InMemoryBatchRepository } from '../testing/in-memory-batch.repository';
import { CompleteBatchUseCase } from './complete-batch.use-case';

const now = new Date('2026-01-01T00:00:00Z');

function seedBatch(repo: InMemoryBatchRepository): Promise<Batch> {
  return repo.create(
    Batch.create({
      id: 'batch-1',
      productionOrderId: 'po-1',
      sequence: 1,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  );
}

describe('CompleteBatchUseCase', () => {
  let batches: InMemoryBatchRepository;
  let audit: InMemoryAuditLogWriter;
  let useCase: CompleteBatchUseCase;

  beforeEach(() => {
    batches = new InMemoryBatchRepository();
    audit = new InMemoryAuditLogWriter();
    useCase = new CompleteBatchUseCase(
      batches,
      audit,
      new FixedClock(now),
      new ImmediateTransactionRunner(),
    );
  });

  it('completes the batch and records a STATUS_CHANGE / BATCH audit entry', async () => {
    await seedBatch(batches);

    const completed = await useCase.execute('batch-1');

    expect(completed.completedAt).toEqual(now);
    expect(audit.records).toHaveLength(1);
    expect(audit.records[0]).toEqual({
      action: AuditAction.STATUS_CHANGE,
      entityType: AuditEntityType.BATCH,
      entityId: 'batch-1',
      userId: null,
      metadata: { from: 'OPEN', to: 'COMPLETED' },
    });
  });

  it('throws when the batch does not exist', async () => {
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(BatchNotFoundError);
    expect(audit.records).toHaveLength(0);
  });

  it('rejects completing an already completed batch', async () => {
    await seedBatch(batches);
    await useCase.execute('batch-1');

    await expect(useCase.execute('batch-1')).rejects.toBeInstanceOf(BatchAlreadyCompletedError);
    expect(audit.records).toHaveLength(1);
  });
});
