import { AuditEntry, AuditLogWriter } from '../ports/audit-log-writer';

export class InMemoryAuditLogWriter implements AuditLogWriter {
  readonly records: AuditEntry[] = [];

  record(entry: AuditEntry): Promise<void> {
    this.records.push(entry);
    return Promise.resolve();
  }
}
