import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module';
import { configureApp } from '../../../../configure-app';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { MachineResponse } from '../dto/machine.response';

const createdCodes: string[] = [];

let app: INestApplication;
let baseUrl: string;

function uniqueCode(): string {
  const code = `E2E-${randomUUID()}`;
  createdCodes.push(code);
  return code;
}

function postMachine(payload: unknown): Promise<Response> {
  return fetch(`${baseUrl}/machines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

function patchStatus(id: string, status: string): Promise<Response> {
  return fetch(`${baseUrl}/machines/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

describe('Machines HTTP (e2e)', () => {
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
    if (createdCodes.length > 0) {
      await app.get(PrismaService).machine.deleteMany({ where: { code: { in: createdCodes } } });
    }
    await app.close();
  });

  it('GET /machines returns 200 and an array', async () => {
    const res = await fetch(`${baseUrl}/machines`);

    expect(res.status).toBe(200);
    expect(Array.isArray((await res.json()) as MachineResponse[])).toBe(true);
  });

  it('POST /machines creates a machine (201) with coherent timestamps', async () => {
    const code = uniqueCode();
    const res = await postMachine({ code, name: 'E2E Machine' });

    expect(res.status).toBe(201);
    const body = (await res.json()) as MachineResponse;
    expect(body.status).toBe('ACTIVE');
    expect(body.location).toBeNull();
    expect(body.createdAt).toBe(body.updatedAt);
  });

  it('GET /machines/:id returns the created machine', async () => {
    const code = uniqueCode();
    const created = (await (
      await postMachine({ code, name: 'E2E Get' })
    ).json()) as MachineResponse;

    const res = await fetch(`${baseUrl}/machines/${created.id}`);

    expect(res.status).toBe(200);
    expect(((await res.json()) as MachineResponse).code).toBe(code);
  });

  it('PATCH /machines/:id/status updates the status (200)', async () => {
    const code = uniqueCode();
    const created = (await (
      await postMachine({ code, name: 'E2E Patch' })
    ).json()) as MachineResponse;

    const res = await patchStatus(created.id, 'MAINTENANCE');

    expect(res.status).toBe(200);
    expect(((await res.json()) as MachineResponse).status).toBe('MAINTENANCE');
  });

  it('GET /machines/:missing returns 404 (domain error mapping)', async () => {
    const res = await fetch(`${baseUrl}/machines/00000000-0000-0000-0000-000000000000`);

    expect(res.status).toBe(404);
    expect(((await res.json()) as { error: string }).error).toBe('MachineNotFoundError');
  });

  it('POST with a duplicate code returns 409', async () => {
    const code = uniqueCode();
    await postMachine({ code, name: 'first' });

    expect((await postMachine({ code, name: 'second' })).status).toBe(409);
  });

  it('POST with an empty code returns 400 (validation)', async () => {
    expect((await postMachine({ code: '', name: '' })).status).toBe(400);
  });

  it('PATCH with an invalid status returns 400', async () => {
    const code = uniqueCode();
    const created = (await (
      await postMachine({ code, name: 'E2E Bad' })
    ).json()) as MachineResponse;

    expect((await patchStatus(created.id, 'WRONG')).status).toBe(400);
  });
});
