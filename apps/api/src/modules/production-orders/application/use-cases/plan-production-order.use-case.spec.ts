import { beforeEach, describe, expect, it } from 'vitest';
import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderStatus } from '../../domain/entities/production-order-status';
import { InvalidProductionOrderTransitionError } from '../../domain/errors/invalid-production-order-transition.error';
import { ProductionOrderNotFoundError } from '../../domain/errors/production-order-not-found.error';
import { FixedClock } from '../testing/fakes';
import { ImmediateTransactionRunner } from '../testing/immediate-transaction-runner';
import { InMemoryAuditLogWriter } from '../testing/in-memory-audit-log-writer';
import { InMemoryProductionOrderRepository } from '../testing/in-memory-production-order.repository';
import { PlanProductionOrderUseCase } from './plan-production-order.use-case';

const now = new Date('2026-01-01T00:00:00Z');

function draftOrder(id: string): ProductionOrder {
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

describe('PlanProductionOrderUseCase', () => {
  let orders: InMemoryProductionOrderRepository;
  let audit: InMemoryAuditLogWriter;
  let useCase: PlanProductionOrderUseCase;

  beforeEach(() => {
    orders = new InMemoryProductionOrderRepository();
    audit = new InMemoryAuditLogWriter();
    useCase = new PlanProductionOrderUseCase(
      orders,
      audit,
      new FixedClock(now),
      new ImmediateTransactionRunner(),
    );
  });

  it('plans a DRAFT order and records a STATUS_CHANGE audit entry', async () => {
    await orders.create(draftOrder('po-1'));

    const updated = await useCase.execute('po-1');

    expect(updated.status).toBe(ProductionOrderStatus.PLANNED);
    expect(updated.plannedAt).toEqual(now);
    expect(audit.records).toHaveLength(1);
    expect(audit.records[0]).toMatchObject({
      action: 'STATUS_CHANGE',
      entityType: 'PRODUCTION_ORDER',
      entityId: 'po-1',
      userId: null,
      metadata: { from: 'DRAFT', to: 'PLANNED' },
    });
  });

  it('throws when the order does not exist', async () => {
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(ProductionOrderNotFoundError);
  });

  it('propagates an invalid transition and records no audit', async () => {
    await orders.create(draftOrder('po-1').plan(now));

    await expect(useCase.execute('po-1')).rejects.toBeInstanceOf(
      InvalidProductionOrderTransitionError,
    );
    expect(audit.records).toHaveLength(0);
  });
});
