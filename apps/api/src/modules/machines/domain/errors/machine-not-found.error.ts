import { NotFoundDomainError } from '../../../../shared/domain/errors/not-found.error';

export class MachineNotFoundError extends NotFoundDomainError {
  static byId(id: string): MachineNotFoundError {
    return new MachineNotFoundError(`Machine with id "${id}" was not found.`);
  }
}
