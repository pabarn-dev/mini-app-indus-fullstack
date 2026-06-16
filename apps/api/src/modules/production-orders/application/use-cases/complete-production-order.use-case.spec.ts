import { beforeEach, describe, expect, it } from 'vitest';
import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderStatus } from '../../domain/entities/production-order-status';
import { InvalidProductionOrderTransitionError } from '../../domain/errors/invalid-production-order-transition.error';
import { ProductionOrderHasFailedQualityCheckError } from '../../domain/errors/production-order-has-failed-quality-check.error';
import { ProductionOrderNotFoundError } from '../../domain/errors/production-order-not-found.error';
import { FixedClock } from '../testing/fakes';
import { ImmediateTransactionRunner } from '../testing/immediate-transaction-runner';
import { InMemoryAuditLogWriter } from '../testing/in-memory-audit-log-writer';
import { InMemoryProductionOrderQualityGate } from '../testing/in-memory-production-order-quality-gate';
import { InMemoryProductionOrderRepository } from '../testing/in-memory-production-order.repository';
import { CompleteProductionOrderUseCase } from './complete-production-order.use-case';

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

describe('CompleteProductionOrderUseCase', () => {
  let orders: InMemoryProductionOrderRepository;
  let audit: InMemoryAuditLogWriter;
  let qualityGate: InMemoryProductionOrderQualityGate;
  let useCase: CompleteProductionOrderUseCase;

  beforeEach(() => {
    orders = new InMemoryProductionOrderRepository();
    audit = new InMemoryAuditLogWriter();
    qualityGate = new InMemoryProductionOrderQualityGate();
    useCase = new CompleteProductionOrderUseCase(
      orders,
      audit,
      new FixedClock(now),
      new ImmediateTransactionRunner(),
      qualityGate,
    );
  });

  it('completes an IN_PROGRESS order and records an audit entry', async () => {
    await orders.create(order('po-1').plan(now).start(now));

    const updated = await useCase.execute('po-1');

    expect(updated.status).toBe(ProductionOrderStatus.COMPLETED);
    expect(updated.completedAt).toEqual(now);
    expect(audit.records[0]).toMatchObject({ metadata: { from: 'IN_PROGRESS', to: 'COMPLETED' } });
  });

  it('refuses completion and writes no audit when a batch has a FAILED quality check', async () => {
    await orders.create(order('po-fail').plan(now).start(now));
    qualityGate.markFailed('po-fail');

    await expect(useCase.execute('po-fail')).rejects.toBeInstanceOf(
      ProductionOrderHasFailedQualityCheckError,
    );

    expect((await orders.findById('po-fail'))?.status).toBe(ProductionOrderStatus.IN_PROGRESS);
    expect(audit.records).toHaveLength(0);
  });

  it('throws when the order does not exist', async () => {
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(ProductionOrderNotFoundError);
  });

  it('propagates an invalid transition (order still DRAFT)', async () => {
    await orders.create(order('po-2'));

    await expect(useCase.execute('po-2')).rejects.toBeInstanceOf(
      InvalidProductionOrderTransitionError,
    );
  });
});
