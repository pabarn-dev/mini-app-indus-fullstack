import { Machine } from '../../domain/entities/machine';
import { MachineNotFoundError } from '../../domain/errors/machine-not-found.error';
import { MachineRepository } from '../ports/machine.repository';

export class GetMachineByIdUseCase {
  constructor(private readonly machines: MachineRepository) {}

  async execute(id: string): Promise<Machine> {
    const machine = await this.machines.findById(id);
    if (machine === null) {
      throw MachineNotFoundError.byId(id);
    }
    return machine;
  }
}
