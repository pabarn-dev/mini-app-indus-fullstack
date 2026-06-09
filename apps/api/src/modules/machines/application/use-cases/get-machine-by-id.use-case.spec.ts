import { beforeEach, describe, expect, it } from 'vitest';
import { MachineNotFoundError } from '../../domain/errors/machine-not-found.error';
import { FixedClock, SequentialIdGenerator } from '../testing/fakes';
import { InMemoryMachineRepository } from '../testing/in-memory-machine.repository';
import { CreateMachineUseCase } from './create-machine.use-case';
import { GetMachineByIdUseCase } from './get-machine-by-id.use-case';

describe('GetMachineByIdUseCase', () => {
  let repository: InMemoryMachineRepository;
  let getMachine: GetMachineByIdUseCase;
  let createMachine: CreateMachineUseCase;

  beforeEach(() => {
    repository = new InMemoryMachineRepository();
    getMachine = new GetMachineByIdUseCase(repository);
    createMachine = new CreateMachineUseCase(
      repository,
      new SequentialIdGenerator(),
      new FixedClock(new Date('2026-01-01T00:00:00Z')),
    );
  });

  it('returns the machine when it exists', async () => {
    await createMachine.execute({ code: 'CNC-01', name: 'Mill 01' });

    const machine = await getMachine.execute('machine-1');

    expect(machine.code).toBe('CNC-01');
  });

  it('throws when the machine does not exist', async () => {
    await expect(getMachine.execute('missing')).rejects.toBeInstanceOf(MachineNotFoundError);
  });
});
