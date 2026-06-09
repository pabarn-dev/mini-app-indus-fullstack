import { DomainError } from './domain.error';

// Semantic base → presentation maps it to HTTP 409.
export abstract class ConflictDomainError extends DomainError {}
