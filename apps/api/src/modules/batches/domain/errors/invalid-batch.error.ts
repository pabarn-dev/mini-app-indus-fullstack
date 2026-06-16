import { ValidationDomainError } from '../../../../shared/domain/errors/validation.error';

// Raised when an entity-level invariant of Batch is violated.
export class InvalidBatchError extends ValidationDomainError {
  static invalidSequence(): InvalidBatchError {
    return new InvalidBatchError('Batch sequence must be a positive integer.');
  }
}
