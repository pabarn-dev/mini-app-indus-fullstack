import { Machine } from '../../domain/entities/machine';
import { MachineRepository } from '../ports/machine.repository';

export class ListMachinesUseCase {
  constructor(private readonly machines: MachineRepository) {}

  execute(): Promise<Machine[]> {
    return this.machines.findAll();
  }
}
