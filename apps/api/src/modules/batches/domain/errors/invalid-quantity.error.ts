import { ValidationDomainError } from '../../../../shared/domain/errors/validation.error';

// Raised when a produced quantity is not a non-negative integer.
export class InvalidQuantityError extends ValidationDomainError {
  static notNonNegativeInteger(): InvalidQuantityError {
    return new InvalidQuantityError('Produced quantity must be a non-negative integer.');
  }
}
