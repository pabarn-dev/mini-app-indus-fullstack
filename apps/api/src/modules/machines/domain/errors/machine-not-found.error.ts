import { DomainError } from './domain.error';

export class MachineNotFoundError extends DomainError {
  static byId(id: string): MachineNotFoundError {
    return new MachineNotFoundError(`Machine with id "${id}" was not found.`);
  }
}
