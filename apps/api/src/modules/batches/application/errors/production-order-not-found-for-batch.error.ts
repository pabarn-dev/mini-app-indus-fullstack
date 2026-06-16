import { NotFoundDomainError } from '../../../../shared/domain/errors/not-found.error';

export class ProductionOrderNotFoundForBatchError extends NotFoundDomainError {
  static byId(productionOrderId: string): ProductionOrderNotFoundForBatchError {
    return new ProductionOrderNotFoundForBatchError(
      `Production order with id "${productionOrderId}" was not found.`,
    );
  }
}
