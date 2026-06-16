import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module';
import { configureApp } from '../../../../configure-app';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { BatchResponse } from '../dto/batch.response';
import { QualityCheckResponse } from '../dto/quality-check.response';

let app: INestApplication;
let baseUrl: string;

function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

async function createMachine(): Promise<string> {
  const res = await fetch(
    `${baseUrl}/machines`,
    jsonInit('POST', { code: `E2E-BATCH-MACHINE-${randomUUID()}`, name: 'E2E Batch Machine' }),
  );
  return ((await res.json()) as { id: string }).id;
}

async function createDraftOrder(): Promise<string> {
  const res = await fetch(
    `${baseUrl}/production-orders`,
    jsonInit('POST', {
      reference: `E2E-BATCH-${randomUUID()}`,
      targetQuantity: 100,
      machineId: await createMachine(),
    }),
  );
  return ((await res.json()) as { id: string }).id;
}

async function createInProgressOrder(): Promise<string> {
  const orderId = await createDraftOrder();
  await fetch(`${baseUrl}/production-orders/${orderId}/plan`, { method: 'POST' });
  await fetch(`${baseUrl}/production-orders/${orderId}/start`, { method: 'POST' });
  return orderId;
}

function createBatch(productionOrderId: string): Promise<Response> {
  return fetch(`${baseUrl}/batches`, jsonInit('POST', { productionOrderId }));
}

describe('Batches HTTP (e2e)', () => {
  beforeAll(async () => {
    const rootEnv = resolve(process.cwd(), '../../.env');
    if (existsSync(rootEnv)) {
      process.loadEnvFile(rootEnv);
    }
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    const prisma = app.get(PrismaService);
    const orderIds = (
      await prisma.productionOrder.findMany({
        where: { reference: { startsWith: 'E2E-BATCH-' } },
        select: { id: true },
      })
    ).map((order) => order.id);
    const batchIds = (
      await prisma.batch.findMany({
        where: { productionOrderId: { in: orderIds } },
        select: { id: true },
      })
    ).map((batch) => batch.id);
    const checkIds = (
      await prisma.qualityCheck.findMany({
        where: { batchId: { in: batchIds } },
        select: { id: true },
      })
    ).map((check) => check.id);

    if (checkIds.length > 0) {
      await prisma.qualityCheck.deleteMany({ where: { id: { in: checkIds } } });
    }
    await prisma.auditLog.deleteMany({
      where: { entityId: { in: [...orderIds, ...batchIds, ...checkIds] } },
    });
    if (batchIds.length > 0) {
      await prisma.batch.deleteMany({ where: { id: { in: batchIds } } });
    }
    await prisma.productionOrder.deleteMany({ where: { reference: { startsWith: 'E2E-BATCH-' } } });
    await prisma.machine.deleteMany({ where: { code: { startsWith: 'E2E-BATCH-MACHINE-' } } });
    await app.close();
  });

  it('creates batches with auto-incremented sequence on an IN_PROGRESS order', async () => {
    const orderId = await createInProgressOrder();

    const firstRes = await createBatch(orderId);
    expect(firstRes.status).toBe(201);
    const first = (await firstRes.json()) as BatchResponse;
    expect(first.sequence).toBe(1);
    expect(first.quantityProduced).toBe(0);
    expect(first.completedAt).toBeNull();

    const second = (await (await createBatch(orderId)).json()) as BatchResponse;
    expect(second.sequence).toBe(2);
  });

  it('returns 409 when creating a batch on a non IN_PROGRESS order', async () => {
    const orderId = await createDraftOrder();

    expect((await createBatch(orderId)).status).toBe(409);
  });

  it('records quantity (set) and forbids it once the batch is completed', async () => {
    const orderId = await createInProgressOrder();
    const batch = (await (await createBatch(orderId)).json()) as BatchResponse;

    const patched = await fetch(
      `${baseUrl}/batches/${batch.id}/quantity`,
      jsonInit('PATCH', { quantity: 42 }),
    );
    expect(patched.status).toBe(200);
    expect(((await patched.json()) as BatchResponse).quantityProduced).toBe(42);

    const completeRes = await fetch(`${baseUrl}/batches/${batch.id}/complete`, { method: 'POST' });
    expect(completeRes.status).toBe(200);
    expect(((await completeRes.json()) as BatchResponse).completedAt).not.toBeNull();

    const afterComplete = await fetch(
      `${baseUrl}/batches/${batch.id}/quantity`,
      jsonInit('PATCH', { quantity: 99 }),
    );
    expect(afterComplete.status).toBe(409);

    const logs = await app.get(PrismaService).auditLog.findMany({ where: { entityId: batch.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('STATUS_CHANGE');
    expect(logs[0]?.entityType).toBe('BATCH');
  });

  it('lists batches by productionOrderId and gets one by id', async () => {
    const orderId = await createInProgressOrder();
    const batch = (await (await createBatch(orderId)).json()) as BatchResponse;

    const listRes = await fetch(`${baseUrl}/batches?productionOrderId=${orderId}`);
    expect(listRes.status).toBe(200);
    expect(((await listRes.json()) as BatchResponse[]).map((b) => b.id)).toEqual([batch.id]);

    const getRes = await fetch(`${baseUrl}/batches/${batch.id}`);
    expect(getRes.status).toBe(200);
    expect(((await getRes.json()) as BatchResponse).id).toBe(batch.id);
  });

  it('adds quality checks of every result and lists them', async () => {
    const orderId = await createInProgressOrder();
    const batch = (await (await createBatch(orderId)).json()) as BatchResponse;

    for (const result of ['PASSED', 'WARNING', 'FAILED']) {
      const res = await fetch(
        `${baseUrl}/batches/${batch.id}/quality-checks`,
        jsonInit('POST', { result }),
      );
      expect(res.status).toBe(201);
      const check = (await res.json()) as QualityCheckResponse;
      expect(check.result).toBe(result);
      expect(check.checkedById).toBeNull();
    }

    const listRes = await fetch(`${baseUrl}/batches/${batch.id}/quality-checks`);
    expect(listRes.status).toBe(200);
    expect(((await listRes.json()) as QualityCheckResponse[]).map((c) => c.result)).toEqual([
      'PASSED',
      'WARNING',
      'FAILED',
    ]);
  });

  it('refuses to complete a production order when a batch has a FAILED quality check (5E)', async () => {
    const orderId = await createInProgressOrder();
    const batch = (await (await createBatch(orderId)).json()) as BatchResponse;
    await fetch(
      `${baseUrl}/batches/${batch.id}/quality-checks`,
      jsonInit('POST', { result: 'FAILED' }),
    );

    const completeRes = await fetch(`${baseUrl}/production-orders/${orderId}/complete`, {
      method: 'POST',
    });

    expect(completeRes.status).toBe(409);
  });

  it('returns 404 for a missing batch', async () => {
    const res = await fetch(`${baseUrl}/batches/00000000-0000-0000-0000-000000000000`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid bodies', async () => {
    const orderId = await createInProgressOrder();
    const batch = (await (await createBatch(orderId)).json()) as BatchResponse;

    const badResult = await fetch(
      `${baseUrl}/batches/${batch.id}/quality-checks`,
      jsonInit('POST', { result: 'UNKNOWN' }),
    );
    expect(badResult.status).toBe(400);

    const negativeQuantity = await fetch(
      `${baseUrl}/batches/${batch.id}/quantity`,
      jsonInit('PATCH', { quantity: -1 }),
    );
    expect(negativeQuantity.status).toBe(400);

    const emptyCreate = await fetch(`${baseUrl}/batches`, jsonInit('POST', {}));
    expect(emptyCreate.status).toBe(400);
  });
});
