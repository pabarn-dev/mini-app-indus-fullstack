import { ConflictDomainError } from '../../../../shared/domain/errors/conflict.error';

// Raised when an operation is attempted on a batch that is already completed.
export class BatchAlreadyCompletedError extends ConflictDomainError {
  static cannot(operation: string): BatchAlreadyCompletedError {
    return new BatchAlreadyCompletedError(`Cannot ${operation} a batch that is already completed.`);
  }
}
