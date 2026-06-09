import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ConflictDomainError } from '../../domain/errors/conflict.error';
import { DomainError } from '../../domain/errors/domain.error';
import { NotFoundDomainError } from '../../domain/errors/not-found.error';
import { ValidationDomainError } from '../../domain/errors/validation.error';

// Maps domain errors to HTTP responses by semantic base. Scoped strictly to
// DomainError — technical errors are left to Nest's default handling (no catch-all).
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter<DomainError> {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.statusFor(exception);

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }

  private statusFor(exception: DomainError): number {
    if (exception instanceof NotFoundDomainError) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof ConflictDomainError) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof ValidationDomainError) {
      return HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.BAD_REQUEST;
  }
}
