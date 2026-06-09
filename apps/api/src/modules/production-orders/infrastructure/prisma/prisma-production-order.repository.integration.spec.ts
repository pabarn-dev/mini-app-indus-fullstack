import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaTransactionRunner } from '../../../../infrastructure/prisma/prisma-transaction-runner';
import { Clock } from '../../../../shared/application/ports/clock';
import { Machine } from '../../../machines/domain/entities/machine';
import { PrismaMachineRepository } from '../../../machines/infrastructure/prisma/prisma-machine.repository';
import { PlanProductionOrderUseCase } from '../../application/use-cases/plan-production-order.use-case';
import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderStatus } from '../../domain/entities/production-order-status';
import { MachineGatewayAdapter } from './machine-gateway.adapter';
import { PrismaAuditLogWriter } from './prisma-audit-log-writer';
import { PrismaProductionOrderRepository } from './prisma-production-order.repository';

const fixedNow = new Date('2026-02-01T00:00:00Z');
const clock: Clock = { now: () => fixedNow };

const createdOrderIds: string[] = [];
let machineId: string;

let prisma: PrismaService;
let repository: PrismaProductionOrderRepository;
let audit: PrismaAuditLogWriter;
let runner: PrismaTransactionRunner;
let gateway: MachineGatewayAdapter;

function buildOrder(): ProductionOrder {
  const order = ProductionOrder.create({
    id: randomUUID(),
    reference: `PO-TEST-${randomUUID()}`,
    targetQuantity: 50,
    machineId,
    createdById: null,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
  createdOrderIds.push(order.id);
  return order;
}

describe('PrismaProductionOrderRepository (integration)', () => {
  beforeAll(async () => {
    const rootEnv = resolve(process.cwd(), '../../.env');
    if (existsSync(rootEnv)) {
      process.loadEnvFile(rootEnv);
    }
    prisma = new PrismaService();
    await prisma.onModuleInit();

    repository = new PrismaProductionOrderRepository(prisma);
    audit = new PrismaAuditLogWriter(prisma);
    runner = new PrismaTransactionRunner(prisma);
    const machineRepository = new PrismaMachineRepository(prisma);
    gateway = new MachineGatewayAdapter(machineRepository);

    const machine = await machineRepository.create(
      Machine.create({
        id: randomUUID(),
        code: `MACHINE-TEST-${randomUUID()}`,
        name: 'PO Integration Machine',
        location: 'Test Lab',
        createdAt: fixedNow,
        updatedAt: fixedNow,
      }),
    );
    machineId = machine.id;
  });

  afterAll(async () => {
    if (createdOrderIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { entityId: { in: createdOrderIds } } });
      await prisma.productionOrder.deleteMany({ where: { id: { in: createdOrderIds } } });
    }
    await prisma.machine.deleteMany({ where: { id: machineId } });
    await prisma.onModuleDestroy();
  });

  it('persists and reads back an order with domain-provided timestamps', async () => {
    const order = buildOrder();

    const created = await repository.create(order);

    expect(created).toBeInstanceOf(ProductionOrder);
    expect(created.status).toBe(ProductionOrderStatus.DRAFT);
    expect(created.createdAt.toISOString()).toBe(fixedNow.toISOString());
    expect((await repository.findById(order.id))?.reference).toBe(order.reference);
    expect((await repository.findByReference(order.reference))?.id).toBe(order.id);
  });

  it('exposes the machine read model through the gateway', async () => {
    const snapshot = await gateway.findById(machineId);

    expect(snapshot).toEqual({ id: machineId, status: 'ACTIVE', isUsable: true });
    expect(await gateway.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('commits the order update and the audit entry atomically', async () => {
    const order = await repository.create(buildOrder());
    const useCase = new PlanProductionOrderUseCase(repository, audit, clock, runner);

    const planned = await useCase.execute(order.id);

    expect(planned.status).toBe(ProductionOrderStatus.PLANNED);
    const persisted = await repository.findById(order.id);
    expect(persisted?.status).toBe(ProductionOrderStatus.PLANNED);
    const logs = await prisma.auditLog.findMany({ where: { entityId: order.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.metadata).toEqual({ from: 'DRAFT', to: 'PLANNED' });
  });

  it('rolls back the order update AND the audit when the transaction throws', async () => {
    const order = await repository.create(buildOrder());

    await expect(
      prisma.runInTransaction(async () => {
        await repository.update(order.plan(fixedNow));
        await audit.record({
          action: 'STATUS_CHANGE',
          entityType: 'PRODUCTION_ORDER',
          entityId: order.id,
          userId: null,
          metadata: { from: 'DRAFT', to: 'PLANNED' },
        });
        throw new Error('boom after update + audit');
      }),
    ).rejects.toThrow('boom after update + audit');

    const persisted = await repository.findById(order.id);
    const logs = await prisma.auditLog.findMany({ where: { entityId: order.id } });

    expect(persisted?.status).toBe(ProductionOrderStatus.DRAFT);
    expect(logs).toHaveLength(0);
  });
});
