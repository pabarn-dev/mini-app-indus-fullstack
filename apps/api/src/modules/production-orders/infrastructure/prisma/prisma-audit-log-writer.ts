import { Injectable } from '@nestjs/common';
import {
  AuditAction as PrismaAuditAction,
  AuditEntityType as PrismaAuditEntityType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  AuditAction,
  AuditEntityType,
  AuditEntry,
  AuditLogWriter,
} from '../../application/ports/audit-log-writer';

const toPrismaAction: Record<AuditAction, PrismaAuditAction> = {
  [AuditAction.CREATE]: PrismaAuditAction.CREATE,
  [AuditAction.UPDATE]: PrismaAuditAction.UPDATE,
  [AuditAction.DELETE]: PrismaAuditAction.DELETE,
  [AuditAction.STATUS_CHANGE]: PrismaAuditAction.STATUS_CHANGE,
};

const toPrismaEntityType: Record<AuditEntityType, PrismaAuditEntityType> = {
  [AuditEntityType.USER]: PrismaAuditEntityType.USER,
  [AuditEntityType.MACHINE]: PrismaAuditEntityType.MACHINE,
  [AuditEntityType.PRODUCTION_ORDER]: PrismaAuditEntityType.PRODUCTION_ORDER,
  [AuditEntityType.BATCH]: PrismaAuditEntityType.BATCH,
  [AuditEntityType.QUALITY_CHECK]: PrismaAuditEntityType.QUALITY_CHECK,
};

@Injectable()
export class PrismaAuditLogWriter implements AuditLogWriter {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.db.auditLog.create({
      data: {
        action: toPrismaAction[entry.action],
        entityType: toPrismaEntityType[entry.entityType],
        entityId: entry.entityId,
        userId: entry.userId,
        metadata:
          entry.metadata === null ? Prisma.DbNull : (entry.metadata as Prisma.InputJsonValue),
      },
    });
  }
}
