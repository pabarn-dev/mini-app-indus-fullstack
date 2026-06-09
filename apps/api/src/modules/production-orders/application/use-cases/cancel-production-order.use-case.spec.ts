import { beforeEach, describe, expect, it } from 'vitest';
import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderStatus } from '../../domain/entities/production-order-status';
import { InvalidProductionOrderTransitionError } from '../../domain/errors/invalid-production-order-transition.error';
import { ProductionOrderNotFoundError } from '../../domain/errors/production-order-not-found.error';
import { InMemoryAuditLogWriter } from '../testing/in-memory-audit-log-writer';
import { InMemoryProductionOrderRepository } from '../testing/in-memory-production-order.repository';
import { CancelProductionOrderUseCase } from './cancel-production-order.use-case';

const now = new Date('2026-01-01T00:00:00Z');

function order(id: string): ProductionOrder {
  return ProductionOrder.create({
    id,
    reference: `REF-${id}`,
    targetQuantity: 10,
    machineId: 'machine-1',
    createdById: null,
    createdAt: now,
    updatedAt: now,
  });
}

describe('CancelProductionOrderUseCase', () => {
  let orders: InMemoryProductionOrderRepository;
  let audit: InMemoryAuditLogWriter;
  let useCase: CancelProductionOrderUseCase;

  beforeEach(() => {
    orders = new InMemoryProductionOrderRepository();
    audit = new InMemoryAuditLogWriter();
    useCase = new CancelProductionOrderUseCase(orders, audit);
  });

  it('cancels a DRAFT order and records an audit entry', async () => {
    await orders.create(order('po-1'));

    const updated = await useCase.execute('po-1');

    expect(updated.status).toBe(ProductionOrderStatus.CANCELLED);
    expect(audit.records[0]).toMatchObject({ metadata: { from: 'DRAFT', to: 'CANCELLED' } });
  });

  it('throws when the order does not exist', async () => {
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(ProductionOrderNotFoundError);
  });

  it('cannot cancel a terminal (COMPLETED) order', async () => {
    await orders.create(order('po-2').plan(now).start(now).complete(now));

    await expect(useCase.execute('po-2')).rejects.toBeInstanceOf(
      InvalidProductionOrderTransitionError,
    );
  });
});
