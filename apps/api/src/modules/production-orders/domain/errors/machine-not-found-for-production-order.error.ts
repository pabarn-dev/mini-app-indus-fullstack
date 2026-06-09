import { NotFoundDomainError } from '../../../../shared/domain/errors/not-found.error';

export class MachineNotFoundForProductionOrderError extends NotFoundDomainError {
  static byId(machineId: string): MachineNotFoundForProductionOrderError {
    return new MachineNotFoundForProductionOrderError(
      `Machine with id "${machineId}" was not found.`,
    );
  }
}
