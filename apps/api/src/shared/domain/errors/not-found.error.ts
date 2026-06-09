import { DomainError } from './domain.error';

// Semantic base → presentation maps it to HTTP 404.
export abstract class NotFoundDomainError extends DomainError {}
