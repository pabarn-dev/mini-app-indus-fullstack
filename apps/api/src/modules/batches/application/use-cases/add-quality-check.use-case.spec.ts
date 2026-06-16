import { beforeEach, describe, expect, it } from 'vitest';
import {
  AuditAction,
  AuditEntityType,
} from '../../../../shared/application/ports/audit-log-writer';
import { Batch } from '../../domain/entities/batch';
import { InvalidQualityCheckError } from '../../domain/errors/invalid-quality-check.error';
import { QualityCheckResult } from '../../domain/entities/quality-check-result';
import { BatchNotFoundError } from '../errors/batch-not-found.error';
import { FixedClock, SequentialIdGenerator } from '../testing/fakes';
import { ImmediateTransactionRunner } from '../testing/immediate-transaction-runner';
import { InMemoryAuditLogWriter } from '../testing/in-memory-audit-log-writer';
import { InMemoryBatchRepository } from '../testing/in-memory-batch.repository';
import { InMemoryQualityCheckRepository } from '../testing/in-memory-quality-check.repository';
import { AddQualityCheckUseCase } from './add-quality-check.use-case';

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

describe('AddQualityCheckUseCase', () => {
  let batches: InMemoryBatchRepository;
  let checks: InMemoryQualityCheckRepository;
  let audit: InMemoryAuditLogWriter;
  let useCase: AddQualityCheckUseCase;

  beforeEach(() => {
    batches = new InMemoryBatchRepository();
    checks = new InMemoryQualityCheckRepository();
    audit = new InMemoryAuditLogWriter();
    useCase = new AddQualityCheckUseCase(
      batches,
      checks,
      audit,
      new SequentialIdGenerator('qc'),
      new FixedClock(now),
      new ImmediateTransactionRunner(),
    );
  });

  it('adds a check and records a CREATE / QUALITY_CHECK audit entry', async () => {
    await seedBatch(batches);

    const check = await useCase.execute({ batchId: 'batch-1', result: QualityCheckResult.PASSED });

    expect(check.batchId).toBe('batch-1');
    expect(check.checkedById).toBeNull();
    expect(audit.records).toHaveLength(1);
    expect(audit.records[0]).toEqual({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.QUALITY_CHECK,
      entityId: check.id,
      userId: null,
      metadata: { batchId: 'batch-1', result: QualityCheckResult.PASSED },
    });
  });

  it('accepts PASSED, WARNING and FAILED', async () => {
    await seedBatch(batches);

    for (const result of ['PASSED', 'WARNING', 'FAILED']) {
      const check = await useCase.execute({ batchId: 'batch-1', result });
      expect(check.result).toBe(result);
    }
    expect(checks.findByBatchId('batch-1')).resolves.toHaveLength(3);
  });

  it('throws when the batch does not exist', async () => {
    await expect(
      useCase.execute({ batchId: 'missing', result: QualityCheckResult.PASSED }),
    ).rejects.toBeInstanceOf(BatchNotFoundError);
    expect(audit.records).toHaveLength(0);
  });

  it('rejects an invalid result and writes no audit', async () => {
    await seedBatch(batches);

    await expect(useCase.execute({ batchId: 'batch-1', result: 'UNKNOWN' })).rejects.toBeInstanceOf(
      InvalidQualityCheckError,
    );
    expect(audit.records).toHaveLength(0);
  });
});
