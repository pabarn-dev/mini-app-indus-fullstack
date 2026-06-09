import { NotFoundDomainError } from '../../../../shared/domain/errors/not-found.error';

export class ProductionOrderNotFoundError extends NotFoundDomainError {
  static byId(id: string): ProductionOrderNotFoundError {
    return new ProductionOrderNotFoundError(`Production order with id "${id}" was not found.`);
  }
}
