import { Machine } from '../../domain/entities/machine';
import { DuplicateMachineCodeError } from '../../domain/errors/duplicate-machine-code.error';
import { Clock } from '../ports/clock';
import { IdGenerator } from '../ports/id-generator';
import { MachineRepository } from '../ports/machine.repository';

export interface CreateMachineInput {
  readonly code: string;
  readonly name: string;
  readonly location?: string | null;
}

export class CreateMachineUseCase {
  constructor(
    private readonly machines: MachineRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateMachineInput): Promise<Machine> {
    const now = this.clock.now();
    // Domain validates & normalizes (trim, non-empty) here.
    const machine = Machine.create({
      id: this.idGenerator.generate(),
      code: input.code,
      name: input.name,
      location: input.location ?? null,
      createdAt: now,
      updatedAt: now,
    });

    const existing = await this.machines.findByCode(machine.code);
    if (existing !== null) {
      throw DuplicateMachineCodeError.forCode(machine.code);
    }

    return this.machines.create(machine);
  }
}
