import { ConflictDomainError } from '../../../../shared/domain/errors/conflict.error';

export class MachineNotUsableForProductionOrderError extends ConflictDomainError {
  static disabled(machineId: string): MachineNotUsableForProductionOrderError {
    return new MachineNotUsableForProductionOrderError(
      `Machine "${machineId}" is disabled and cannot be used for a production order.`,
    );
  }

  static notActive(machineId: string): MachineNotUsableForProductionOrderError {
    return new MachineNotUsableForProductionOrderError(
      `Machine "${machineId}" must be ACTIVE to start a production order.`,
    );
  }
}
