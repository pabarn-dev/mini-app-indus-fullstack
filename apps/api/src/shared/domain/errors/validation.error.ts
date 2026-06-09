import { DomainError } from './domain.error';

// Semantic base → presentation maps it to HTTP 400.
export abstract class ValidationDomainError extends DomainError {}
