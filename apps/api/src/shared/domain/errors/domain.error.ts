// Base class for all domain errors. Presentation maps these to transport-specific
// responses (e.g. HTTP status codes) outside the domain.
export abstract class DomainError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
