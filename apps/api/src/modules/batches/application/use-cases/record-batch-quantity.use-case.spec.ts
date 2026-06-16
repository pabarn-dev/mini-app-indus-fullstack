import { beforeEach, describe, expect, it } from 'vitest';
import { BatchAlreadyCompletedError } from '../../domain/errors/batch-already-completed.error';
import { InvalidQuantityError } from '../../domain/errors/invalid-quantity.error';
import { Batch } from '../../domain/entities/batch';
import { BatchNotFoundError } from '../errors/batch-not-found.error';
import { InMemoryBatchRepository } from '../testing/in-memory-batch.repository';
import { RecordBatchQuantityUseCase } from './record-batch-quantity.use-case';

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

describe('RecordBatchQuantityUseCase', () => {
  let batches: InMemoryBatchRepository;
  let useCase: RecordBatchQuantityUseCase;

  beforeEach(() => {
    batches = new InMemoryBatchRepository();
    useCase = new RecordBatchQuantityUseCase(batches);
  });

  it('replaces the produced quantity (set, not delta)', async () => {
    await seedBatch(batches);

    await useCase.execute({ batchId: 'batch-1', quantity: 40 });
    const updated = await useCase.execute({ batchId: 'batch-1', quantity: 75 });

    expect(updated.quantityProduced).toBe(75);
  });

  it('throws when the batch does not exist', async () => {
    await expect(useCase.execute({ batchId: 'missing', quantity: 10 })).rejects.toBeInstanceOf(
      BatchNotFoundError,
    );
  });

  it('rejects a negative quantity (domain invariant)', async () => {
    await seedBatch(batches);

    await expect(useCase.execute({ batchId: 'batch-1', quantity: -1 })).rejects.toBeInstanceOf(
      InvalidQuantityError,
    );
  });

  it('rejects recording on a completed batch', async () => {
    await batches.create(
      Batch.create({
        id: 'batch-2',
        productionOrderId: 'po-1',
        sequence: 2,
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      }).complete(now),
    );

    await expect(useCase.execute({ batchId: 'batch-2', quantity: 10 })).rejects.toBeInstanceOf(
      BatchAlreadyCompletedError,
    );
  });
});
