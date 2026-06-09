import { beforeEach, describe, expect, it } from 'vitest';
import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderStatus } from '../../domain/entities/production-order-status';
import { InvalidProductionOrderTransitionError } from '../../domain/errors/invalid-production-order-transition.error';
import { MachineNotFoundForProductionOrderError } from '../../domain/errors/machine-not-found-for-production-order.error';
import { MachineNotUsableForProductionOrderError } from '../../domain/errors/machine-not-usable-for-production-order.error';
import { ProductionOrderNotFoundError } from '../../domain/errors/production-order-not-found.error';
import { FixedClock } from '../testing/fakes';
import { InMemoryAuditLogWriter } from '../testing/in-memory-audit-log-writer';
import { InMemoryMachineGateway } from '../testing/in-memory-machine-gateway';
import { InMemoryProductionOrderRepository } from '../testing/in-memory-production-order.repository';
import { StartProductionOrderUseCase } from './start-production-order.use-case';

const now = new Date('2026-01-01T00:00:00Z');

function orderOnMachine(id: string, machineId: string): ProductionOrder {
  return ProductionOrder.create({
    id,
    reference: `REF-${id}`,
    targetQuantity: 10,
    machineId,
    createdById: null,
    createdAt: now,
    updatedAt: now,
  });
}

describe('StartProductionOrderUseCase', () => {
  let orders: InMemoryProductionOrderRepository;
  let machines: InMemoryMachineGateway;
  let audit: InMemoryAuditLogWriter;
  let useCase: StartProductionOrderUseCase;

  beforeEach(() => {
    orders = new InMemoryProductionOrderRepository();
    machines = new InMemoryMachineGateway();
    machines.set({ id: 'machine-active', status: 'ACTIVE', isUsable: true });
    machines.set({ id: 'machine-maintenance', status: 'MAINTENANCE', isUsable: false });
    audit = new InMemoryAuditLogWriter();
    useCase = new StartProductionOrderUseCase(orders, machines, audit, new FixedClock(now));
  });

  it('starts a PLANNED order on an ACTIVE machine and records an audit entry', async () => {
    await orders.create(orderOnMachine('po-1', 'machine-active').plan(now));

    const updated = await useCase.execute('po-1');

    expect(updated.status).toBe(ProductionOrderStatus.IN_PROGRESS);
    expect(updated.startedAt).toEqual(now);
    expect(audit.records).toHaveLength(1);
    expect(audit.records[0]).toMatchObject({ metadata: { from: 'PLANNED', to: 'IN_PROGRESS' } });
  });

  it('throws when the order does not exist', async () => {
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(ProductionOrderNotFoundError);
  });

  it('throws when the machine no longer exists', async () => {
    await orders.create(orderOnMachine('po-2', 'missing-machine').plan(now));

    await expect(useCase.execute('po-2')).rejects.toBeInstanceOf(
      MachineNotFoundForProductionOrderError,
    );
  });

  it('throws when the machine is not ACTIVE', async () => {
    await orders.create(orderOnMachine('po-3', 'machine-maintenance').plan(now));

    await expect(useCase.execute('po-3')).rejects.toBeInstanceOf(
      MachineNotUsableForProductionOrderError,
    );
  });

  it('propagates an invalid transition (order still DRAFT)', async () => {
    await orders.create(orderOnMachine('po-4', 'machine-active'));

    await expect(useCase.execute('po-4')).rejects.toBeInstanceOf(
      InvalidProductionOrderTransitionError,
    );
  });
});
