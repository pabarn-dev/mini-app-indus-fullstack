import { v7 as uuidv7 } from 'uuid';
import { IdGenerator } from '../../modules/machines/application/ports/id-generator';

// Application id generation (UUIDv7, time-ordered). The domain never generates ids.
export class UuidV7Generator implements IdGenerator {
  generate(): string {
    return uuidv7();
  }
}
