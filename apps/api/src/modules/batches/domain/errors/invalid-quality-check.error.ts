import { ValidationDomainError } from '../../../../shared/domain/errors/validation.error';

// Raised when an entity-level invariant of QualityCheck is violated.
export class InvalidQualityCheckError extends ValidationDomainError {
  static invalidResult(): InvalidQualityCheckError {
    return new InvalidQualityCheckError(
      'Quality check result must be one of PASSED, WARNING, FAILED.',
    );
  }
}
