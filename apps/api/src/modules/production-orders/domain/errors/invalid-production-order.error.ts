import { ValidationDomainError } from '../../../../shared/domain/errors/validation.error';

// Raised when an entity-level invariant of ProductionOrder is violated.
export class InvalidProductionOrderError extends ValidationDomainError {
  static emptyReference(): InvalidProductionOrderError {
    return new InvalidProductionOrderError('Production order reference must not be empty.');
  }

  static invalidTargetQuantity(): InvalidProductionOrderError {
    return new InvalidProductionOrderError(
      'Production order target quantity must be a positive integer.',
    );
  }
}
