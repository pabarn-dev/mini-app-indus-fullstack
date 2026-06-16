import { ConflictDomainError } from '../../../../shared/domain/errors/conflict.error';

export class ProductionOrderNotReadyForBatchError extends ConflictDomainError {
  static notInProgress(
    productionOrderId: string,
    status: string,
  ): ProductionOrderNotReadyForBatchError {
    return new ProductionOrderNotReadyForBatchError(
      `Production order "${productionOrderId}" must be IN_PROGRESS to accept a batch (current status: "${status}").`,
    );
  }
}
