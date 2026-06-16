import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaAuditLogWriter } from '../../../../infrastructure/prisma/prisma-audit-log-writer';
import { PrismaTransactionRunner } from '../../../../infrastructure/prisma/prisma-transaction-runner';
import { Clock } from '../../../../shared/application/ports/clock';
import { Batch } from '../../../batches/domain/entities/batch';
import { QualityCheck } from '../../../batches/domain/entities/quality-check';
import { QualityCheckResult } from '../../../batches/domain/entities/quality-check-result';
import { PrismaBatchRepository } from '../../../batches/infrastructure/prisma/prisma-batch.repository';
import { PrismaQualityCheckRepository } from '../../../batches/infrastructure/prisma/prisma-quality-check.repository';
import { Machine } from '../../../machines/domain/entities/machine';
import { PrismaMachineRepository } from '../../../machines/infrastructure/prisma/prisma-machine.repository';
import { CompleteProductionOrderUseCase } from '../../application/use-cases/complete-production-order.use-case';
import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderHasFailedQualityCheckError } from '../../domain/errors/production-order-has-failed-quality-check.error';
import { ProductionOrderStatus } from '../../domain/entities/production-order-status';
import { PrismaProductionOrderRepository } from './prisma-production-order.repository';
import { PrismaProductionOrderQualityGate } from './production-order-quality-gate.adapter';

const fixedNow = new Date('2026-04-01T00:00:00Z');
const clock: Clock = { now: () => fixedNow };

const orderIds: string[] = [];
const batchIds: string[] = [];
const checkIds: string[] = [];
let machineId: string;

let prisma: PrismaService;
let orderRepo: PrismaProductionOrderRepository;
let batchRepo: PrismaBatchRepository;
let checkRepo: PrismaQualityCheckRepository;
let audit: PrismaAuditLogWriter;
let runner: PrismaTransactionRunner;
let gate: PrismaProductionOrderQualityGate;
let useCase: CompleteProductionOrderUseCase;

async function buildInProgressOrder(): Promise<ProductionOrder> {
  const order = ProductionOrder.create({
    id: randomUUID(),
    reference: `PO-GATE-${randomUUID()}`,
    targetQuantity: 100,
    machineId,
    createdById: null,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
  orderIds.push(order.id);
  await orderRepo.create(order);
  return orderRepo.update(order.plan(fixedNow).start(fixedNow));
}

async function buildBatch(orderId: string): Promise<Batch> {
  const batch = Batch.create({
    id: randomUUID(),
    productionOrderId: orderId,
    sequence: 1,
    startedAt: fixedNow,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
  batchIds.push(batch.id);
  return batchRepo.create(batch);
}

async function addCheck(batchId: string, result: QualityCheckResult): Promise<void> {
  const check = QualityCheck.create({
    id: randomUUID(),
    batchId,
    result,
    createdAt: fixedNow,
  });
  checkIds.push(check.id);
  await checkRepo.create(check);
}

describe('PrismaProductionOrderQualityGate + CompleteProductionOrderUseCase (integration)', () => {
  beforeAll(async () => {
    const rootEnv = resolve(process.cwd(), '../../.env');
    if (existsSync(rootEnv)) {
      process.loadEnvFile(rootEnv);
    }
    prisma = new PrismaService();
    await prisma.onModuleInit();

    orderRepo = new PrismaProductionOrderRepository(prisma);
    batchRepo = new PrismaBatchRepository(prisma);
    checkRepo = new PrismaQualityCheckRepository(prisma);
    audit = new PrismaAuditLogWriter(prisma);
    runner = new PrismaTransactionRunner(prisma);
    gate = new PrismaProductionOrderQualityGate(prisma);
    useCase = new CompleteProductionOrderUseCase(orderRepo, audit, clock, runner, gate);

    const machineRepository = new PrismaMachineRepository(prisma);
    const machine = await machineRepository.create(
      Machine.create({
        id: randomUUID(),
        code: `MACHINE-GATE-${randomUUID()}`,
        name: 'Quality Gate Machine',
        location: 'Test Lab',
        createdAt: fixedNow,
        updatedAt: fixedNow,
      }),
    );
    machineId = machine.id;
  });

  afterAll(async () => {
    if (checkIds.length > 0) {
      await prisma.qualityCheck.deleteMany({ where: { id: { in: checkIds } } });
    }
    await prisma.auditLog.deleteMany({ where: { entityId: { in: orderIds } } });
    if (batchIds.length > 0) {
      await prisma.batch.deleteMany({ where: { id: { in: batchIds } } });
    }
    if (orderIds.length > 0) {
      await prisma.productionOrder.deleteMany({ where: { id: { in: orderIds } } });
    }
    await prisma.machine.deleteMany({ where: { id: machineId } });
    await prisma.onModuleDestroy();
  });

  it('detects a FAILED quality check through the gate', async () => {
    const order = await buildInProgressOrder();
    const batch = await buildBatch(order.id);
    await addCheck(batch.id, QualityCheckResult.FAILED);

    expect(await gate.hasFailedQualityCheck(order.id)).toBe(true);
  });

  it('refuses completion and writes no audit when a batch has a FAILED check', async () => {
    const order = await buildInProgressOrder();
    const batch = await buildBatch(order.id);
    await addCheck(batch.id, QualityCheckResult.FAILED);

    await expect(useCase.execute(order.id)).rejects.toBeInstanceOf(
      ProductionOrderHasFailedQualityCheckError,
    );

    expect((await orderRepo.findById(order.id))?.status).toBe(ProductionOrderStatus.IN_PROGRESS);
    expect(await prisma.auditLog.findMany({ where: { entityId: order.id } })).toHaveLength(0);
  });

  it('completes when only PASSED / WARNING checks exist', async () => {
    const order = await buildInProgressOrder();
    const batch = await buildBatch(order.id);
    await addCheck(batch.id, QualityCheckResult.PASSED);
    await addCheck(batch.id, QualityCheckResult.WARNING);

    const completed = await useCase.execute(order.id);

    expect(completed.status).toBe(ProductionOrderStatus.COMPLETED);
    const logs = await prisma.auditLog.findMany({ where: { entityId: order.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.metadata).toEqual({ from: 'IN_PROGRESS', to: 'COMPLETED' });
  });

  it('completes an order that has no batch', async () => {
    const order = await buildInProgressOrder();

    const completed = await useCase.execute(order.id);

    expect(completed.status).toBe(ProductionOrderStatus.COMPLETED);
  });
});
