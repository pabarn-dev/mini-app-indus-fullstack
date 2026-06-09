import { DomainError } from './domain.error';

// Raised when an entity-level invariant of Machine is violated.
export class InvalidMachineError extends DomainError {
  static emptyCode(): InvalidMachineError {
    return new InvalidMachineError('Machine code must not be empty.');
  }

  static emptyName(): InvalidMachineError {
    return new InvalidMachineError('Machine name must not be empty.');
  }
}
