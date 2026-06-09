import { ConflictDomainError } from '../../../../shared/domain/errors/conflict.error';

export class DuplicateMachineCodeError extends ConflictDomainError {
  static forCode(code: string): DuplicateMachineCodeError {
    return new DuplicateMachineCodeError(`A machine with code "${code}" already exists.`);
  }
}
