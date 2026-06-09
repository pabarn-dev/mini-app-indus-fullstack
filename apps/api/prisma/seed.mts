import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { MachineStatus, PrismaClient, ProductionOrderStatus, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 runtime requires a driver adapter. Load the shared root .env
// (Node 24 built-in) so DATABASE_URL is available when run via `db:seed`.
const rootEnv = resolve(process.cwd(), '../../.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL is not set — copy .env.example to .env first.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  // Users — upsert on the unique email (idempotent).
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ipp.local' },
    update: { name: 'Admin User', role: UserRole.ADMIN },
    create: { email: 'admin@ipp.local', name: 'Admin User', role: UserRole.ADMIN },
  });

  await prisma.user.upsert({
    where: { email: 'operator@ipp.local' },
    update: { name: 'Operator User', role: UserRole.OPERATOR },
    create: { email: 'operator@ipp.local', name: 'Operator User', role: UserRole.OPERATOR },
  });

  // Machines — upsert on the unique code (idempotent).
  const activeMachine = await prisma.machine.upsert({
    where: { code: 'CNC-01' },
    update: { name: 'CNC Milling Machine 01', status: MachineStatus.ACTIVE, location: 'Hall A' },
    create: {
      code: 'CNC-01',
      name: 'CNC Milling Machine 01',
      status: MachineStatus.ACTIVE,
      location: 'Hall A',
    },
  });

  await prisma.machine.upsert({
    where: { code: 'CNC-02' },
    update: {
      name: 'CNC Milling Machine 02',
      status: MachineStatus.MAINTENANCE,
      location: 'Hall A',
    },
    create: {
      code: 'CNC-02',
      name: 'CNC Milling Machine 02',
      status: MachineStatus.MAINTENANCE,
      location: 'Hall A',
    },
  });

  // Production orders — upsert on the unique reference. Both reference the
  // ACTIVE machine and are created by the admin user.
  await prisma.productionOrder.upsert({
    where: { reference: 'PO-2026-0001' },
    update: {
      status: ProductionOrderStatus.DRAFT,
      targetQuantity: 100,
      machineId: activeMachine.id,
      createdById: admin.id,
    },
    create: {
      reference: 'PO-2026-0001',
      status: ProductionOrderStatus.DRAFT,
      targetQuantity: 100,
      machineId: activeMachine.id,
      createdById: admin.id,
    },
  });

  await prisma.productionOrder.upsert({
    where: { reference: 'PO-2026-0002' },
    update: {
      status: ProductionOrderStatus.PLANNED,
      targetQuantity: 250,
      machineId: activeMachine.id,
      createdById: admin.id,
      plannedAt: new Date('2026-06-15T08:00:00Z'),
    },
    create: {
      reference: 'PO-2026-0002',
      status: ProductionOrderStatus.PLANNED,
      targetQuantity: 250,
      machineId: activeMachine.id,
      createdById: admin.id,
      plannedAt: new Date('2026-06-15T08:00:00Z'),
    },
  });

  console.log('Seed completed: 2 users, 2 machines, 2 production orders (idempotent).');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
