// Audit enums (domain unions, mapped to Prisma enums in infrastructure).
// Kept here for now; extractable to a shared audit module when Batches reuse it.
export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const AuditEntityType = {
  USER: 'USER',
  MACHINE: 'MACHINE',
  PRODUCTION_ORDER: 'PRODUCTION_ORDER',
  BATCH: 'BATCH',
  QUALITY_CHECK: 'QUALITY_CHECK',
} as const;
export type AuditEntityType = (typeof AuditEntityType)[keyof typeof AuditEntityType];

export interface AuditEntry {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  userId: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditLogWriter {
  record(entry: AuditEntry): Promise<void>;
}

export const AUDIT_LOG_WRITER = Symbol('AuditLogWriter');
