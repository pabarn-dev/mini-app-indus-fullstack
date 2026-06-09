import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DomainExceptionFilter } from './shared/presentation/filters/domain-exception.filter';

// Shared app configuration used by both the runtime bootstrap (main.ts) and the
// e2e tests, so they exercise the exact same pipeline (validation + error mapping).
export function configureApp(app: INestApplication): void {
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
}
