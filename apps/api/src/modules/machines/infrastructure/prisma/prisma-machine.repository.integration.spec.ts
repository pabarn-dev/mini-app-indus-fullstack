import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SystemClock } from '../../../../infrastructure/clock/system.clock';
import { UuidV7Generator } from '../../../../infrastructure/id/uuid-v7.generator';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Machine } from '../../domain/entities/machine';
import { MachineStatus } from '../../domain/entities/machine-status';
import { PrismaMachineRepository } from './prisma-machine.repository';

const idGenerator = new UuidV7Generator();
const clock = new SystemClock();
const createdIds: string[] = [];

let prisma: PrismaService;
let repository: PrismaMachineRepository;

function buildMachine(): Machine {
  const now = clock.now();
  return Machine.create({
    id: idGenerator.generate(),
    code: `TEST-${idGenerator.generate()}`,
    name: 'Integration Test Machine',
    location: 'Test Lab',
    createdAt: now,
    updatedAt: now,
  });
}

describe('PrismaMachineRepository (integration)', () => {
  beforeAll(async () => {
    const rootEnv = resolve(process.cwd(), '../../.env');
    if (existsSync(rootEnv)) {
      process.loadEnvFile(rootEnv);
    }
    prisma = new PrismaService();
    await prisma.onModuleInit();
    repository = new PrismaMachineRepository(prisma);
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.machine.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.onModuleDestroy();
  });

  it('persists a machine and reads it back as a domain entity', async () => {
    const machine = buildMachine();
    createdIds.push(machine.id);

    const created = await repository.create(machine);

    expect(created).toBeInstanceOf(Machine);
    expect(created.status).toBe(MachineStatus.ACTIVE);
    // createdAt comes from the domain Clock and must be persisted as-is.
    expect(created.createdAt.toISOString()).toBe(machine.createdAt.toISOString());

    const byId = await repository.findById(machine.id);
    const byCode = await repository.findByCode(machine.code);
    const all = await repository.findAll();

    expect(byId?.code).toBe(machine.code);
    expect(byCode?.id).toBe(machine.id);
    expect(all.some((item) => item.id === machine.id)).toBe(true);
  });

  it('updates status and refreshes updatedAt via @updatedAt', async () => {
    const machine = buildMachine();
    createdIds.push(machine.id);
    const created = await repository.create(machine);

    const updated = await repository.update(created.changeStatus(MachineStatus.MAINTENANCE));

    expect(updated.status).toBe(MachineStatus.MAINTENANCE);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
  });

  it('returns null for a missing id', async () => {
    expect(await repository.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });
});
