import { beforeEach, describe, expect, it } from 'vitest';
import { FixedClock, SequentialIdGenerator } from '../testing/fakes';
import { InMemoryMachineRepository } from '../testing/in-memory-machine.repository';
import { CreateMachineUseCase } from './create-machine.use-case';
import { ListMachinesUseCase } from './list-machines.use-case';

describe('ListMachinesUseCase', () => {
  let repository: InMemoryMachineRepository;
  let listMachines: ListMachinesUseCase;
  let createMachine: CreateMachineUseCase;

  beforeEach(() => {
    repository = new InMemoryMachineRepository();
    listMachines = new ListMachinesUseCase(repository);
    createMachine = new CreateMachineUseCase(
      repository,
      new SequentialIdGenerator(),
      new FixedClock(new Date('2026-01-01T00:00:00Z')),
    );
  });

  it('returns an empty list initially', async () => {
    expect(await listMachines.execute()).toEqual([]);
  });

  it('returns all created machines', async () => {
    await createMachine.execute({ code: 'CNC-01', name: 'Mill 01' });
    await createMachine.execute({ code: 'CNC-02', name: 'Mill 02' });

    const machines = await listMachines.execute();

    expect(machines).toHaveLength(2);
    expect(machines.map((machine) => machine.code)).toEqual(['CNC-01', 'CNC-02']);
  });
});
