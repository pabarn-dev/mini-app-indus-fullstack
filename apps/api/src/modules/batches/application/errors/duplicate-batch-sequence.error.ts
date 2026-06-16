import { ConflictDomainError } from '../../../../shared/domain/errors/conflict.error';

// Raised when a (productionOrderId, sequence) collision occurs — typically under
// concurrency. Translated from the Prisma unique-constraint violation in 5D.
export class DuplicateBatchSequenceError extends ConflictDomainError {
  static forSequence(productionOrderId: string, sequence: number): DuplicateBatchSequenceError {
    return new DuplicateBatchSequenceError(
      `Batch sequence ${sequence} already exists for production order "${productionOrderId}".`,
    );
  }
}
