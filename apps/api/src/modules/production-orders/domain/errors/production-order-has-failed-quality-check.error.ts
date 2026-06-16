import { ConflictDomainError } from '../../../../shared/domain/errors/conflict.error';

// Raised when completing an order whose batches include a FAILED quality check.
export class ProductionOrderHasFailedQualityCheckError extends ConflictDomainError {
  static forOrder(id: string): ProductionOrderHasFailedQualityCheckError {
    return new ProductionOrderHasFailedQualityCheckError(
      `Production order "${id}" cannot be completed: at least one batch has a FAILED quality check.`,
    );
  }
}
