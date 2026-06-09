import { ConflictDomainError } from '../../../../shared/domain/errors/conflict.error';

export class DuplicateProductionOrderReferenceError extends ConflictDomainError {
  static forReference(reference: string): DuplicateProductionOrderReferenceError {
    return new DuplicateProductionOrderReferenceError(
      `A production order with reference "${reference}" already exists.`,
    );
  }
}
