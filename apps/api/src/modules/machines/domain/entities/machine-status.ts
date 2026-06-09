// Domain-owned status, independent from the Prisma enum. The mapping between
// this type and Prisma's MachineStatus lives in the infrastructure layer (3D).
export const MachineStatus = {
  ACTIVE: 'ACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  DISABLED: 'DISABLED',
} as const;

export type MachineStatus = (typeof MachineStatus)[keyof typeof MachineStatus];
