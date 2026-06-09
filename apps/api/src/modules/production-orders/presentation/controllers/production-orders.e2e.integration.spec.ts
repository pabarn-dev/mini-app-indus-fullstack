import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module';
import { configureApp } from '../../../../configure-app';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ProductionOrderResponse } from '../dto/production-order.response';

let app: INestApplication;
let baseUrl: string;
let activeMachineId: string;
let maintenanceMachineId: string;

function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function createOrder(machineId: string): Promise<Response> {
  return fetch(
    `${baseUrl}/production-orders`,
    jsonInit('POST', { reference: `E2E-PO-${randomUUID()}`, targetQuantity: 50, machineId }),
  );
}

function action(id: string, act: string): Promise<Response> {
  return fetch(`${baseUrl}/production-orders/${id}/${act}`, { method: 'POST' });
}

async function createMachine(name: string): Promise<string> {
  const res = await fetch(
    `${baseUrl}/machines`,
    jsonInit('POST', { code: `E2E-PO-MACHINE-${randomUUID()}`, name }),
  );
  return ((await res.json()) as { id: string }).id;
}

describe('Production Orders HTTP (e2e)', () => {
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

    // Self-contained test machines (no dependency on the seed).
    activeMachineId = await createMachine('E2E PO Active');
    maintenanceMachineId = await createMachine('E2E PO Maintenance');
    await fetch(
      `${baseUrl}/machines/${maintenanceMachineId}/status`,
      jsonInit('PATCH', { status: 'MAINTENANCE' }),
    );
  });

  afterAll(async () => {
    const prisma = app.get(PrismaService);
    const orderIds = (
      await prisma.productionOrder.findMany({
        where: { reference: { startsWith: 'E2E-PO-' } },
        select: { id: true },
      })
    ).map((order) => order.id);
    if (orderIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { entityId: { in: orderIds } } });
    }
    await prisma.productionOrder.deleteMany({ where: { reference: { startsWith: 'E2E-PO-' } } });
    await prisma.machine.deleteMany({ where: { code: { startsWith: 'E2E-PO-MACHINE-' } } });
    await app.close();
  });

  it('runs the full lifecycle create → plan → start → complete and records audit entries', async () => {
    const createRes = await createOrder(activeMachineId);
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as ProductionOrderResponse;
    expect(created.status).toBe('DRAFT');

    const planRes = await action(created.id, 'plan');
    expect(planRes.status).toBe(200);
    expect(((await planRes.json()) as ProductionOrderResponse).status).toBe('PLANNED');

    const startRes = await action(created.id, 'start');
    expect(startRes.status).toBe(200);
    expect(((await startRes.json()) as ProductionOrderResponse).status).toBe('IN_PROGRESS');

    const completeRes = await action(created.id, 'complete');
    expect(completeRes.status).toBe(200);
    const completed = (await completeRes.json()) as ProductionOrderResponse;
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).not.toBeNull();

    const logs = await app.get(PrismaService).auditLog.findMany({
      where: { entityId: created.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(logs).toHaveLength(3);
    expect(
      logs.every(
        (log) =>
          log.action === 'STATUS_CHANGE' &&
          log.entityType === 'PRODUCTION_ORDER' &&
          log.userId === null,
      ),
    ).toBe(true);
    expect(logs.map((log) => log.metadata)).toEqual([
      { from: 'DRAFT', to: 'PLANNED' },
      { from: 'PLANNED', to: 'IN_PROGRESS' },
      { from: 'IN_PROGRESS', to: 'COMPLETED' },
    ]);
  });

  it('cancels a DRAFT order', async () => {
    const created = (await (await createOrder(activeMachineId)).json()) as ProductionOrderResponse;

    const res = await action(created.id, 'cancel');

    expect(res.status).toBe(200);
    expect(((await res.json()) as ProductionOrderResponse).status).toBe('CANCELLED');
  });

  it('lists orders and gets one by id', async () => {
    const created = (await (await createOrder(activeMachineId)).json()) as ProductionOrderResponse;

    const listRes = await fetch(`${baseUrl}/production-orders`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray((await listRes.json()) as ProductionOrderResponse[])).toBe(true);

    const getRes = await fetch(`${baseUrl}/production-orders/${created.id}`);
    expect(getRes.status).toBe(200);
    expect(((await getRes.json()) as ProductionOrderResponse).id).toBe(created.id);
  });

  it('returns 404 for a missing order', async () => {
    const res = await fetch(`${baseUrl}/production-orders/00000000-0000-0000-0000-000000000000`);

    expect(res.status).toBe(404);
  });

  it('returns 409 when starting a DRAFT order (invalid transition)', async () => {
    const created = (await (await createOrder(activeMachineId)).json()) as ProductionOrderResponse;

    expect((await action(created.id, 'start')).status).toBe(409);
  });

  it('returns 409 when starting an order on a non-ACTIVE machine', async () => {
    const created = (await (
      await createOrder(maintenanceMachineId)
    ).json()) as ProductionOrderResponse;
    expect(created.status).toBe('DRAFT'); // creation allowed on MAINTENANCE

    expect((await action(created.id, 'plan')).status).toBe(200);
    expect((await action(created.id, 'start')).status).toBe(409);
  });

  it('returns 400 for an invalid body', async () => {
    const res = await fetch(
      `${baseUrl}/production-orders`,
      jsonInit('POST', { reference: '', targetQuantity: 0, machineId: activeMachineId }),
    );

    expect(res.status).toBe(400);
  });
});
