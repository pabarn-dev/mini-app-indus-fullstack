import { beforeEach, describe, expect, it } from 'vitest';
import { Batch } from '../../domain/entities/batch';
import { InMemoryBatchRepository } from '../testing/in-memory-batch.repository';
import { ListBatchesUseCase } from './list-batches.use-case';

const now = new Date('2026-01-01T00:00:00Z');

function batch(id: string, productionOrderId: string, sequence: number): Batch {
  return Batch.create({
    id,
    productionOrderId,
    sequence,
    startedAt: now,
    createdAt: now,
    updatedAt: now,
  });
}

describe('ListBatchesUseCase', () => {
  let batches: InMemoryBatchRepository;
  let useCase: ListBatchesUseCase;

  beforeEach(() => {
    batches = new InMemoryBatchRepository();
    useCase = new ListBatchesUseCase(batches);
  });

  it('returns only the batches of the given production order', async () => {
    await batches.create(batch('b1', 'po-1', 1));
    await batches.create(batch('b2', 'po-1', 2));
    await batches.create(batch('b3', 'po-2', 1));

    const result = await useCase.execute('po-1');

    expect(result.map((b) => b.id).sort()).toEqual(['b1', 'b2']);
  });

  it('returns an empty array when the order has no batch', async () => {
    await expect(useCase.execute('po-empty')).resolves.toEqual([]);
  });
});
