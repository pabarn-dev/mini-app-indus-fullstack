import { Machine } from '../../domain/entities/machine';
import { MachineStatus } from '../../domain/entities/machine-status';
import { MachineNotFoundError } from '../../domain/errors/machine-not-found.error';
import { MachineRepository } from '../ports/machine.repository';

export interface UpdateMachineStatusInput {
  readonly id: string;
  readonly status: MachineStatus;
}

export class UpdateMachineStatusUseCase {
  constructor(private readonly machines: MachineRepository) {}

  async execute(input: UpdateMachineStatusInput): Promise<Machine> {
    const machine = await this.machines.findById(input.id);
    if (machine === null) {
      throw MachineNotFoundError.byId(input.id);
    }

    const updated = machine.changeStatus(input.status);
    return this.machines.update(updated);
  }
}
