// Base class for all domain errors. Frameworks and infrastructure map these to
// transport-specific responses (e.g. HTTP status codes) outside the domain.
export abstract class DomainError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
