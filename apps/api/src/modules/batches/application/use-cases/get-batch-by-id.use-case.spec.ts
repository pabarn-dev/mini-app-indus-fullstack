import { beforeEach, describe, expect, it } from 'vitest';
import { Batch } from '../../domain/entities/batch';
import { BatchNotFoundError } from '../errors/batch-not-found.error';
import { InMemoryBatchRepository } from '../testing/in-memory-batch.repository';
import { GetBatchByIdUseCase } from './get-batch-by-id.use-case';

const now = new Date('2026-01-01T00:00:00Z');

describe('GetBatchByIdUseCase', () => {
  let batches: InMemoryBatchRepository;
  let useCase: GetBatchByIdUseCase;

  beforeEach(() => {
    batches = new InMemoryBatchRepository();
    useCase = new GetBatchByIdUseCase(batches);
  });

  it('returns the batch when it exists', async () => {
    await batches.create(
      Batch.create({
        id: 'batch-1',
        productionOrderId: 'po-1',
        sequence: 1,
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    );

    const batch = await useCase.execute('batch-1');

    expect(batch.id).toBe('batch-1');
  });

  it('throws when the batch does not exist', async () => {
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(BatchNotFoundError);
  });
});
