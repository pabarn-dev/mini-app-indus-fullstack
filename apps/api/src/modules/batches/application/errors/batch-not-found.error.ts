import { NotFoundDomainError } from '../../../../shared/domain/errors/not-found.error';

export class BatchNotFoundError extends NotFoundDomainError {
  static byId(id: string): BatchNotFoundError {
    return new BatchNotFoundError(`Batch with id "${id}" was not found.`);
  }
}
