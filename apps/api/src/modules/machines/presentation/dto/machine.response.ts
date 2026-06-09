import { Machine } from '../../domain/entities/machine';
import { MachineStatus } from '../../domain/entities/machine-status';

export interface MachineResponse {
  id: string;
  code: string;
  name: string;
  status: MachineStatus;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toMachineResponse(machine: Machine): MachineResponse {
  return {
    id: machine.id,
    code: machine.code,
    name: machine.name,
    status: machine.status,
    location: machine.location,
    createdAt: machine.createdAt.toISOString(),
    updatedAt: machine.updatedAt.toISOString(),
  };
}
