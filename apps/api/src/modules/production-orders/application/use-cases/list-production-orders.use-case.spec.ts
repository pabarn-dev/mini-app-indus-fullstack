import { describe, expect, it } from 'vitest';
import { ProductionOrder } from '../../domain/entities/production-order';
import { InMemoryProductionOrderRepository } from '../testing/in-memory-production-order.repository';
import { ListProductionOrdersUseCase } from './list-production-orders.use-case';

const now = new Date('2026-01-01T00:00:00Z');

function makeOrder(id: string, reference: string): ProductionOrder {
  return ProductionOrder.create({
    id,
    reference,
    targetQuantity: 10,
    machineId: 'machine-1',
    createdById: null,
    createdAt: now,
    updatedAt: now,
  });
}

describe('ListProductionOrdersUseCase', () => {
  it('returns an empty list initially', async () => {
    const orders = new InMemoryProductionOrderRepository();

    expect(await new ListProductionOrdersUseCase(orders).execute()).toEqual([]);
  });

  it('returns all created orders', async () => {
    const orders = new InMemoryProductionOrderRepository();
    await orders.create(makeOrder('po-1', 'PO-1'));
    await orders.create(makeOrder('po-2', 'PO-2'));

    expect(await new ListProductionOrdersUseCase(orders).execute()).toHaveLength(2);
  });
});
