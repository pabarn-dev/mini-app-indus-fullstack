import { ConflictDomainError } from '../../../../shared/domain/errors/conflict.error';
import { ProductionOrderStatus } from '../entities/production-order-status';

export class InvalidProductionOrderTransitionError extends ConflictDomainError {
  static from(
    current: ProductionOrderStatus,
    attempted: string,
  ): InvalidProductionOrderTransitionError {
    return new InvalidProductionOrderTransitionError(
      `Cannot ${attempted} a production order in status "${current}".`,
    );
  }
}
