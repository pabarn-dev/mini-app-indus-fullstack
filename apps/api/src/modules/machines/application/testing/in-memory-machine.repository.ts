import { Machine } from '../../domain/entities/machine';
import { MachineRepository } from '../ports/machine.repository';

// Typed in-memory double used by use-case unit tests (no Prisma, no DB).
export class InMemoryMachineRepository implements MachineRepository {
  private readonly machines = new Map<string, Machine>();

  create(machine: Machine): Promise<Machine> {
    this.machines.set(machine.id, machine);
    return Promise.resolve(machine);
  }

  findAll(): Promise<Machine[]> {
    return Promise.resolve([...this.machines.values()]);
  }

  findById(id: string): Promise<Machine | null> {
    return Promise.resolve(this.machines.get(id) ?? null);
  }

  findByCode(code: string): Promise<Machine | null> {
    const found = [...this.machines.values()].find((machine) => machine.code === code);
    return Promise.resolve(found ?? null);
  }

  update(machine: Machine): Promise<Machine> {
    this.machines.set(machine.id, machine);
    return Promise.resolve(machine);
  }
}
