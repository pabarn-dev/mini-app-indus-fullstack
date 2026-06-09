import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';

export class FixedClock implements Clock {
  constructor(private readonly fixed: Date) {}

  now(): Date {
    return this.fixed;
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly prefix: string = 'po') {}

  generate(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
}
