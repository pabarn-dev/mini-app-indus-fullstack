import { DomainError } from './domain.error';

export class DuplicateMachineCodeError extends DomainError {
  static forCode(code: string): DuplicateMachineCodeError {
    return new DuplicateMachineCodeError(`A machine with code "${code}" already exists.`);
  }
}
