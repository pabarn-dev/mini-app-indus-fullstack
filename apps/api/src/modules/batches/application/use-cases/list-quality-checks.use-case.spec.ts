import { beforeEach, describe, expect, it } from 'vitest';
import { QualityCheck } from '../../domain/entities/quality-check';
import { QualityCheckResult } from '../../domain/entities/quality-check-result';
import { InMemoryQualityCheckRepository } from '../testing/in-memory-quality-check.repository';
import { ListQualityChecksUseCase } from './list-quality-checks.use-case';

const now = new Date('2026-01-01T00:00:00Z');

function check(id: string, batchId: string, result: QualityCheckResult): QualityCheck {
  return QualityCheck.create({ id, batchId, result, createdAt: now });
}

describe('ListQualityChecksUseCase', () => {
  let checks: InMemoryQualityCheckRepository;
  let useCase: ListQualityChecksUseCase;

  beforeEach(() => {
    checks = new InMemoryQualityCheckRepository();
    useCase = new ListQualityChecksUseCase(checks);
  });

  it('returns only the checks of the given batch', async () => {
    await checks.create(check('c1', 'batch-1', QualityCheckResult.PASSED));
    await checks.create(check('c2', 'batch-1', QualityCheckResult.FAILED));
    await checks.create(check('c3', 'batch-2', QualityCheckResult.WARNING));

    const result = await useCase.execute('batch-1');

    expect(result.map((c) => c.id).sort()).toEqual(['c1', 'c2']);
  });

  it('returns an empty array when the batch has no check', async () => {
    await expect(useCase.execute('batch-empty')).resolves.toEqual([]);
  });
});
