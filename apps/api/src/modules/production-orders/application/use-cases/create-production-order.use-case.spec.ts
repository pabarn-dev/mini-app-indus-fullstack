import { beforeEach, describe, expect, it } from 'vitest';
import { ProductionOrderStatus } from '../../domain/entities/production-order-status';
import { DuplicateProductionOrderReferenceError } from '../../domain/errors/duplicate-production-order-reference.error';
import { InvalidProductionOrderError } from '../../domain/errors/invalid-production-order.error';
import { MachineNotFoundForProductionOrderError } from '../../domain/errors/machine-not-found-for-production-order.error';
import { MachineNotUsableForProductionOrderError } from '../../domain/errors/machine-not-usable-for-production-order.error';
import { FixedClock, SequentialIdGenerator } from '../testing/fakes';
import { InMemoryMachineGateway } from '../testing/in-memory-machine-gateway';
import { InMemoryProductionOrderRepository } from '../testing/in-memory-production-order.repository';
import { CreateProductionOrderUseCase } from './create-production-order.use-case';

describe('CreateProductionOrderUseCase', () => {
  let orders: InMemoryProductionOrderRepository;
  let machines: InMemoryMachineGateway;
  let useCase: CreateProductionOrderUseCase;

  beforeEach(() => {
    orders = new InMemoryProductionOrderRepository();
    machines = new InMemoryMachineGateway();
    machines.set({ id: 'machine-active', status: 'ACTIVE', isUsable: true });
    machines.set({ id: 'machine-maintenance', status: 'MAINTENANCE', isUsable: false });
    machines.set({ id: 'machine-disabled', status: 'DISABLED', isUsable: false });
    useCase = new CreateProductionOrderUseCase(
      orders,
      machines,
      new SequentialIdGenerator(),
      new FixedClock(new Date('2026-01-01T00:00:00Z')),
    );
  });

  it('creates a DRAFT order on a non-disabled machine', async () => {
    const order = await useCase.execute({
      reference: 'PO-1',
      targetQuantity: 100,
      machineId: 'machine-active',
    });

    expect(order.status).toBe(ProductionOrderStatus.DRAFT);
    expect(order.id).toBe('po-1');
    expect(await orders.findById('po-1')).not.toBeNull();
  });

  it('allows a machine in MAINTENANCE at creation', async () => {
    const order = await useCase.execute({
      reference: 'PO-2',
      targetQuantity: 10,
      machineId: 'machine-maintenance',
    });

    expect(order.status).toBe(ProductionOrderStatus.DRAFT);
  });

  it('rejects a missing machine', async () => {
    await expect(
      useCase.execute({ reference: 'PO-3', targetQuantity: 10, machineId: 'missing' }),
    ).rejects.toBeInstanceOf(MachineNotFoundForProductionOrderError);
  });

  it('rejects a DISABLED machine', async () => {
    await expect(
      useCase.execute({ reference: 'PO-4', targetQuantity: 10, machineId: 'machine-disabled' }),
    ).rejects.toBeInstanceOf(MachineNotUsableForProductionOrderError);
  });

  it('rejects a duplicate reference', async () => {
    await useCase.execute({ reference: 'PO-5', targetQuantity: 10, machineId: 'machine-active' });

    await expect(
      useCase.execute({ reference: 'PO-5', targetQuantity: 10, machineId: 'machine-active' }),
    ).rejects.toBeInstanceOf(DuplicateProductionOrderReferenceError);
  });

  it('propagates domain invariant errors (invalid quantity)', async () => {
    await expect(
      useCase.execute({ reference: 'PO-6', targetQuantity: 0, machineId: 'machine-active' }),
    ).rejects.toBeInstanceOf(InvalidProductionOrderError);
  });
});
