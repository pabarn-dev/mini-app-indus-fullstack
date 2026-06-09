// Minimal read model of a machine, owned by Production Orders. No Prisma type,
// no Machine entity import — the adapter (4D) bridges to the Machines module.
export interface MachineSnapshot {
  id: string;
  status: string;
  isUsable: boolean; // true when ACTIVE (usable to start production)
}

export interface MachineGateway {
  findById(machineId: string): Promise<MachineSnapshot | null>;
}

export const MACHINE_GATEWAY = Symbol('MachineGateway');
