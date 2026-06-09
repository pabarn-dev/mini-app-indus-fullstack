import { describe, expect, it } from 'vitest';
import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderNotFoundError } from '../../domain/errors/production-order-not-found.error';
import { InMemoryProductionOrderRepository } from '../testing/in-memory-production-order.repository';
import { GetProductionOrderByIdUseCase } from './get-production-order-by-id.use-case';

const now = new Date('2026-01-01T00:00:00Z');

describe('GetProductionOrderByIdUseCase', () => {
  it('returns the order when it exists', async () => {
    const orders = new InMemoryProductionOrderRepository();
    await orders.create(
      ProductionOrder.create({
        id: 'po-1',
        reference: 'PO-1',
        targetQuantity: 10,
        machineId: 'machine-1',
        createdById: null,
        createdAt: now,
        updatedAt: now,
      }),
    );

    expect((await new GetProductionOrderByIdUseCase(orders).execute('po-1')).reference).toBe(
      'PO-1',
    );
  });

  it('throws when the order does not exist', async () => {
    await expect(
      new GetProductionOrderByIdUseCase(new InMemoryProductionOrderRepository()).execute('missing'),
    ).rejects.toBeInstanceOf(ProductionOrderNotFoundError);
  });
});
