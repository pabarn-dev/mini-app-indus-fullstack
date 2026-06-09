import {
  Prisma,
  MachineStatus as PrismaMachineStatus,
  type Machine as PrismaMachine,
} from '@prisma/client';
import { Machine } from '../../domain/entities/machine';
import { MachineStatus } from '../../domain/entities/machine-status';

// Explicit, two-way status mapping keeps Prisma types out of the domain.
const toDomainStatus: Record<PrismaMachineStatus, MachineStatus> = {
  [PrismaMachineStatus.ACTIVE]: MachineStatus.ACTIVE,
  [PrismaMachineStatus.MAINTENANCE]: MachineStatus.MAINTENANCE,
  [PrismaMachineStatus.DISABLED]: MachineStatus.DISABLED,
};

const toPrismaStatus: Record<MachineStatus, PrismaMachineStatus> = {
  [MachineStatus.ACTIVE]: PrismaMachineStatus.ACTIVE,
  [MachineStatus.MAINTENANCE]: PrismaMachineStatus.MAINTENANCE,
  [MachineStatus.DISABLED]: PrismaMachineStatus.DISABLED,
};

export class MachineMapper {
  static toDomain(row: PrismaMachine): Machine {
    return Machine.restore({
      id: row.id,
      code: row.code,
      name: row.name,
      status: toDomainStatus[row.status],
      location: row.location,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  // createdAt/updatedAt come from the domain (Clock) — persisted as-is to stay
  // coherent with the use case that produced them.
  static toCreateData(machine: Machine): Prisma.MachineUncheckedCreateInput {
    return {
      id: machine.id,
      code: machine.code,
      name: machine.name,
      status: toPrismaStatus[machine.status],
      location: machine.location,
      createdAt: machine.createdAt,
      updatedAt: machine.updatedAt,
    };
  }

  // updatedAt intentionally omitted → Prisma refreshes it via @updatedAt.
  static toUpdateData(machine: Machine): Prisma.MachineUpdateInput {
    return {
      code: machine.code,
      name: machine.name,
      status: toPrismaStatus[machine.status],
      location: machine.location,
    };
  }
}
