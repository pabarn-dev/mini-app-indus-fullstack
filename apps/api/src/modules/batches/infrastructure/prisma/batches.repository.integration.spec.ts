import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PrismaAuditLogWriter } from '../../../../infrastructure/prisma/prisma-audit-log-writer';
import { PrismaTransactionRunner } from '../../../../infrastructure/prisma/prisma-transaction-runner';
import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { Machine } from '../../../machines/domain/entities/machine';
import { PrismaMachineRepository } from '../../../machines/infrastructure/prisma/prisma-machine.repository';
import { ProductionOrder } from '../../../production-orders/domain/entities/production-order';
import { PrismaProductionOrderRepository } from '../../../production-orders/infrastructure/prisma/prisma-production-order.repository';
import { DuplicateBatchSequenceError } from '../../application/errors/duplicate-batch-sequence.error';
import { AddQualityCheckUseCase } from '../../application/use-cases/add-quality-check.use-case';
import { CompleteBatchUseCase } from '../../application/use-cases/complete-batch.use-case';
import { Batch } from '../../domain/entities/batch';
import { QualityCheck } from '../../domain/entities/quality-check';
import { QualityCheckResult } from '../../domain/entities/quality-check-result';
import { PrismaBatchRepository } from './prisma-batch.repository';
import { PrismaQualityCheckRepository } from './prisma-quality-check.repository';
import { ProductionOrderGatewayAdapter } from './production-order-gateway.adapter';

const fixedNow = new Date('2026-03-01T00:00:00Z');
const clock: Clock = { now: () => fixedNow };
const idGenerator: IdGenerator = { generate: () => randomUUID() };

const orderIds: string[] = [];
const batchIds: string[] = [];
const checkIds: string[] = [];
let machineId: string;

let prisma: PrismaService;
let batchRepo: PrismaBatchRepository;
let checkRepo: PrismaQualityCheckRepository;
let orderRepo: PrismaProductionOrderRepository;
let audit: PrismaAuditLogWriter;
let runner: PrismaTransactionRunner;
let gateway: ProductionOrderGatewayAdapter;

async function buildInProgressOrder(): Promise<ProductionOrder> {
  const order = ProductionOrder.create({
    id: randomUUID(),
    reference: `PO-BATCH-${randomUUID()}`,
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

async function buildPersistedBatch(orderId: string, sequence: number): Promise<Batch> {
  const batch = Batch.create({
    id: randomUUID(),
    productionOrderId: orderId,
    sequence,
    startedAt: fixedNow,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
  batchIds.push(batch.id);
  return batchRepo.create(batch);
}

describe('Batches infrastructure (integration)', () => {
  beforeAll(async () => {
    const rootEnv = resolve(process.cwd(), '../../.env');
    if (existsSync(rootEnv)) {
      process.loadEnvFile(rootEnv);
    }
    prisma = new PrismaService();
    await prisma.onModuleInit();

    batchRepo = new PrismaBatchRepository(prisma);
    checkRepo = new PrismaQualityCheckRepository(prisma);
    orderRepo = new PrismaProductionOrderRepository(prisma);
    audit = new PrismaAuditLogWriter(prisma);
    runner = new PrismaTransactionRunner(prisma);
    gateway = new ProductionOrderGatewayAdapter(orderRepo);

    const machineRepository = new PrismaMachineRepository(prisma);
    const machine = await machineRepository.create(
      Machine.create({
        id: randomUUID(),
        code: `MACHINE-BATCH-${randomUUID()}`,
        name: 'Batch Integration Machine',
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
    await prisma.auditLog.deleteMany({ where: { entityId: { in: [...batchIds, ...checkIds] } } });
    if (batchIds.length > 0) {
      await prisma.batch.deleteMany({ where: { id: { in: batchIds } } });
    }
    if (orderIds.length > 0) {
      await prisma.productionOrder.deleteMany({ where: { id: { in: orderIds } } });
    }
    await prisma.machine.deleteMany({ where: { id: machineId } });
    await prisma.onModuleDestroy();
  });

  it('persists and reads back a batch with domain-provided timestamps', async () => {
    const order = await buildInProgressOrder();

    const created = await buildPersistedBatch(order.id, 1);

    expect(created).toBeInstanceOf(Batch);
    expect(created.quantityProduced).toBe(0);
    expect(created.completedAt).toBeNull();
    expect(created.startedAt.toISOString()).toBe(fixedNow.toISOString());
    expect((await batchRepo.findById(created.id))?.sequence).toBe(1);
    expect((await batchRepo.findByProductionOrderId(order.id)).map((b) => b.id)).toEqual([
      created.id,
    ]);
  });

  it('updates quantity (set) and completion without touching updatedAt manually', async () => {
    const order = await buildInProgressOrder();
    const batch = await buildPersistedBatch(order.id, 1);

    const withQuantity = await batchRepo.update(batch.recordQuantity(42));
    expect(withQuantity.quantityProduced).toBe(42);

    const completed = await batchRepo.update(withQuantity.complete(fixedNow));
    expect(completed.completedAt).not.toBeNull();
  });

  it('translates a unique-constraint violation into DuplicateBatchSequenceError', async () => {
    const order = await buildInProgressOrder();
    await buildPersistedBatch(order.id, 1);

    const duplicate = Batch.create({
      id: randomUUID(),
      productionOrderId: order.id,
      sequence: 1,
      startedAt: fixedNow,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

    await expect(batchRepo.create(duplicate)).rejects.toBeInstanceOf(DuplicateBatchSequenceError);
  });

  it('exposes the production order read model through the gateway', async () => {
    const order = await buildInProgressOrder();

    const snapshot = await gateway.findById(order.id);

    expect(snapshot).toEqual({ id: order.id, status: 'IN_PROGRESS' });
    expect(await gateway.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('persists and reads back quality checks of every result', async () => {
    const order = await buildInProgressOrder();
    const batch = await buildPersistedBatch(order.id, 1);

    for (const result of [
      QualityCheckResult.PASSED,
      QualityCheckResult.WARNING,
      QualityCheckResult.FAILED,
    ]) {
      const check = QualityCheck.create({
        id: randomUUID(),
        batchId: batch.id,
        result,
        createdAt: fixedNow,
      });
      checkIds.push(check.id);
      await checkRepo.create(check);
    }

    const stored = await checkRepo.findByBatchId(batch.id);
    expect(stored.map((c) => c.result)).toEqual(['PASSED', 'WARNING', 'FAILED']);
  });

  it('commits the batch completion and its audit entry atomically', async () => {
    const order = await buildInProgressOrder();
    const batch = await buildPersistedBatch(order.id, 1);
    const useCase = new CompleteBatchUseCase(batchRepo, audit, clock, runner);

    const completed = await useCase.execute(batch.id);

    expect(completed.completedAt).not.toBeNull();
    expect((await batchRepo.findById(batch.id))?.completedAt).not.toBeNull();
    const logs = await prisma.auditLog.findMany({ where: { entityId: batch.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.metadata).toEqual({ from: 'OPEN', to: 'COMPLETED' });
  });

  it('commits the quality check and its audit entry atomically', async () => {
    const order = await buildInProgressOrder();
    const batch = await buildPersistedBatch(order.id, 1);
    const useCase = new AddQualityCheckUseCase(
      batchRepo,
      checkRepo,
      audit,
      idGenerator,
      clock,
      runner,
    );

    const check = await useCase.execute({ batchId: batch.id, result: QualityCheckResult.PASSED });
    checkIds.push(check.id);

    expect((await checkRepo.findByBatchId(batch.id)).map((c) => c.id)).toEqual([check.id]);
    const logs = await prisma.auditLog.findMany({ where: { entityId: check.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.metadata).toEqual({ batchId: batch.id, result: 'PASSED' });
  });

  it('rolls back the batch completion AND the audit when the transaction throws', async () => {
    const order = await buildInProgressOrder();
    const batch = await buildPersistedBatch(order.id, 1);

    await expect(
      prisma.runInTransaction(async () => {
        await batchRepo.update(batch.complete(fixedNow));
        await audit.record({
          action: 'STATUS_CHANGE',
          entityType: 'BATCH',
          entityId: batch.id,
          userId: null,
          metadata: { from: 'OPEN', to: 'COMPLETED' },
        });
        throw new Error('boom after batch update + audit');
      }),
    ).rejects.toThrow('boom after batch update + audit');

    expect((await batchRepo.findById(batch.id))?.completedAt).toBeNull();
    expect(await prisma.auditLog.findMany({ where: { entityId: batch.id } })).toHaveLength(0);
  });

  it('rolls back the quality check AND the audit when the transaction throws', async () => {
    const order = await buildInProgressOrder();
    const batch = await buildPersistedBatch(order.id, 1);
    const check = QualityCheck.create({
      id: randomUUID(),
      batchId: batch.id,
      result: QualityCheckResult.FAILED,
      createdAt: fixedNow,
    });

    await expect(
      prisma.runInTransaction(async () => {
        await checkRepo.create(check);
        await audit.record({
          action: 'CREATE',
          entityType: 'QUALITY_CHECK',
          entityId: check.id,
          userId: null,
          metadata: { batchId: batch.id, result: 'FAILED' },
        });
        throw new Error('boom after quality check + audit');
      }),
    ).rejects.toThrow('boom after quality check + audit');

    expect(await checkRepo.findByBatchId(batch.id)).toHaveLength(0);
    expect(await prisma.auditLog.findMany({ where: { entityId: check.id } })).toHaveLength(0);
  });
});
