import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../../../../shared/domain/errors/domain.error';
import { DuplicateMachineCodeError } from '../../domain/errors/duplicate-machine-code.error';
import { InvalidMachineError } from '../../domain/errors/invalid-machine.error';
import { MachineNotFoundError } from '../../domain/errors/machine-not-found.error';

// Maps domain errors to HTTP responses. Scoped strictly to DomainError — technical
// errors are left to Nest's default handling (never a catch-all).
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
    if (exception instanceof MachineNotFoundError) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof DuplicateMachineCodeError) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof InvalidMachineError) {
      return HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.BAD_REQUEST;
  }
}
