import { describe, expect, it } from 'vitest';
import { InvalidMachineError } from '../errors/invalid-machine.error';
import { Machine, type CreateMachineProps } from './machine';
import { MachineStatus } from './machine-status';

const baseInput: CreateMachineProps = {
  id: 'machine-1',
  code: 'CNC-01',
  name: 'CNC Milling Machine 01',
  location: 'Hall A',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('Machine', () => {
  describe('create', () => {
    it('creates an ACTIVE machine usable for production', () => {
      const machine = Machine.create(baseInput);

      expect(machine.status).toBe(MachineStatus.ACTIVE);
      expect(machine.isUsableForProduction()).toBe(true);
      expect(machine.code).toBe('CNC-01');
    });

    it('trims code and name', () => {
      const machine = Machine.create({ ...baseInput, code: '  CNC-02 ', name: '  Lathe  ' });

      expect(machine.code).toBe('CNC-02');
      expect(machine.name).toBe('Lathe');
    });

    it('defaults location to null when omitted', () => {
      const { location: _location, ...withoutLocation } = baseInput;

      expect(Machine.create(withoutLocation).location).toBeNull();
    });

    it('rejects an empty code', () => {
      expect(() => Machine.create({ ...baseInput, code: '   ' })).toThrow(InvalidMachineError);
    });

    it('rejects an empty name', () => {
      expect(() => Machine.create({ ...baseInput, name: '' })).toThrow(InvalidMachineError);
    });
  });

  describe('changeStatus', () => {
    it('returns a new instance and leaves the original unchanged', () => {
      const machine = Machine.create(baseInput);
      const updated = machine.changeStatus(MachineStatus.MAINTENANCE);

      expect(updated).not.toBe(machine);
      expect(machine.status).toBe(MachineStatus.ACTIVE);
      expect(updated.status).toBe(MachineStatus.MAINTENANCE);
    });

    it('is not usable in MAINTENANCE or DISABLED', () => {
      const machine = Machine.create(baseInput);

      expect(machine.changeStatus(MachineStatus.MAINTENANCE).isUsableForProduction()).toBe(false);
      expect(machine.changeStatus(MachineStatus.DISABLED).isUsableForProduction()).toBe(false);
    });

    it('becomes usable again when set back to ACTIVE', () => {
      const disabled = Machine.create(baseInput).changeStatus(MachineStatus.DISABLED);

      expect(disabled.changeStatus(MachineStatus.ACTIVE).isUsableForProduction()).toBe(true);
    });
  });
});
