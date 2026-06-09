import { beforeEach, describe, expect, it } from 'vitest';
import { MachineStatus } from '../../domain/entities/machine-status';
import { DuplicateMachineCodeError } from '../../domain/errors/duplicate-machine-code.error';
import { InvalidMachineError } from '../../domain/errors/invalid-machine.error';
import { FixedClock, SequentialIdGenerator } from '../testing/fakes';
import { InMemoryMachineRepository } from '../testing/in-memory-machine.repository';
import { CreateMachineUseCase } from './create-machine.use-case';

describe('CreateMachineUseCase', () => {
  let repository: InMemoryMachineRepository;
  let useCase: CreateMachineUseCase;

  beforeEach(() => {
    repository = new InMemoryMachineRepository();
    useCase = new CreateMachineUseCase(
      repository,
      new SequentialIdGenerator(),
      new FixedClock(new Date('2026-01-01T00:00:00Z')),
    );
  });

  it('creates an ACTIVE machine with generated id and timestamps', async () => {
    const machine = await useCase.execute({ code: 'CNC-01', name: 'Mill 01' });

    expect(machine.id).toBe('machine-1');
    expect(machine.status).toBe(MachineStatus.ACTIVE);
    expect(machine.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
    expect(await repository.findById('machine-1')).not.toBeNull();
  });

  it('rejects a duplicate code', async () => {
    await useCase.execute({ code: 'CNC-01', name: 'Mill 01' });

    await expect(useCase.execute({ code: 'CNC-01', name: 'Mill 02' })).rejects.toBeInstanceOf(
      DuplicateMachineCodeError,
    );
  });

  it('propagates domain validation errors (empty code)', async () => {
    await expect(useCase.execute({ code: '   ', name: 'Mill' })).rejects.toBeInstanceOf(
      InvalidMachineError,
    );
  });
});
