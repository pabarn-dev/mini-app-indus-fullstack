import { Machine } from '../../domain/entities/machine';

export interface MachineRepository {
  create(machine: Machine): Promise<Machine>;
  findAll(): Promise<Machine[]>;
  findById(id: string): Promise<Machine | null>;
  findByCode(code: string): Promise<Machine | null>;
  update(machine: Machine): Promise<Machine>;
}

// Runtime DI token (interfaces do not exist at runtime).
export const MACHINE_REPOSITORY = Symbol('MachineRepository');
