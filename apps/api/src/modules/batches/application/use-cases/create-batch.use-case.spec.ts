import { beforeEach, describe, expect, it } from 'vitest';
import { ProductionOrderNotFoundForBatchError } from '../errors/production-order-not-found-for-batch.error';
import { ProductionOrderNotReadyForBatchError } from '../errors/production-order-not-ready-for-batch.error';
import { FixedClock, SequentialIdGenerator } from '../testing/fakes';
import { InMemoryBatchRepository } from '../testing/in-memory-batch.repository';
import { InMemoryProductionOrderGateway } from '../testing/in-memory-production-order-gateway';
import { CreateBatchUseCase } from './create-batch.use-case';

const now = new Date('2026-01-01T00:00:00Z');

describe('CreateBatchUseCase', () => {
  let batches: InMemoryBatchRepository;
  let orders: InMemoryProductionOrderGateway;
  let useCase: CreateBatchUseCase;

  beforeEach(() => {
    batches = new InMemoryBatchRepository();
    orders = new InMemoryProductionOrderGateway();
    useCase = new CreateBatchUseCase(
      batches,
      orders,
      new SequentialIdGenerator(),
      new FixedClock(now),
    );
  });

  it('creates a batch on an IN_PROGRESS order with quantity 0', async () => {
    orders.set({ id: 'po-1', status: 'IN_PROGRESS' });

    const batch = await useCase.execute({ productionOrderId: 'po-1' });

    expect(batch.productionOrderId).toBe('po-1');
    expect(batch.quantityProduced).toBe(0);
    expect(batch.completedAt).toBeNull();
    expect(batch.startedAt).toEqual(now);
  });

  it('assigns sequence automatically as max(sequence) + 1', async () => {
    orders.set({ id: 'po-1', status: 'IN_PROGRESS' });

    const first = await useCase.execute({ productionOrderId: 'po-1' });
    const second = await useCase.execute({ productionOrderId: 'po-1' });

    expect(first.sequence).toBe(1);
    expect(second.sequence).toBe(2);
  });

  it('throws when the production order does not exist', async () => {
    await expect(useCase.execute({ productionOrderId: 'missing' })).rejects.toBeInstanceOf(
      ProductionOrderNotFoundForBatchError,
    );
  });

  it('throws when the production order is not IN_PROGRESS', async () => {
    for (const status of ['DRAFT', 'PLANNED', 'COMPLETED', 'CANCELLED']) {
      orders.set({ id: status, status });
      await expect(useCase.execute({ productionOrderId: status })).rejects.toBeInstanceOf(
        ProductionOrderNotReadyForBatchError,
      );
    }
  });
});
