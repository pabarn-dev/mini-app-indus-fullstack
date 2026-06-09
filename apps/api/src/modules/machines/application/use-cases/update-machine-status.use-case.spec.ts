import { beforeEach, describe, expect, it } from 'vitest';
import { MachineStatus } from '../../domain/entities/machine-status';
import { MachineNotFoundError } from '../../domain/errors/machine-not-found.error';
import { FixedClock, SequentialIdGenerator } from '../testing/fakes';
import { InMemoryMachineRepository } from '../testing/in-memory-machine.repository';
import { CreateMachineUseCase } from './create-machine.use-case';
import { UpdateMachineStatusUseCase } from './update-machine-status.use-case';

describe('UpdateMachineStatusUseCase', () => {
  let repository: InMemoryMachineRepository;
  let updateStatus: UpdateMachineStatusUseCase;
  let createMachine: CreateMachineUseCase;

  beforeEach(() => {
    repository = new InMemoryMachineRepository();
    updateStatus = new UpdateMachineStatusUseCase(repository);
    createMachine = new CreateMachineUseCase(
      repository,
      new SequentialIdGenerator(),
      new FixedClock(new Date('2026-01-01T00:00:00Z')),
    );
  });

  it('updates the status of an existing machine', async () => {
    await createMachine.execute({ code: 'CNC-01', name: 'Mill 01' });

    const updated = await updateStatus.execute({
      id: 'machine-1',
      status: MachineStatus.MAINTENANCE,
    });

    expect(updated.status).toBe(MachineStatus.MAINTENANCE);
    expect(updated.isUsableForProduction()).toBe(false);
  });

  it('throws when the machine does not exist', async () => {
    await expect(
      updateStatus.execute({ id: 'missing', status: MachineStatus.DISABLED }),
    ).rejects.toBeInstanceOf(MachineNotFoundError);
  });
});
