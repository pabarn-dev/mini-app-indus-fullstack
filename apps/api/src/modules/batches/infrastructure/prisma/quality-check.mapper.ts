import {
  Prisma,
  QualityCheckResult as PrismaQualityCheckResult,
  type QualityCheck as PrismaQualityCheck,
} from '@prisma/client';
import { QualityCheck } from '../../domain/entities/quality-check';
import { QualityCheckResult } from '../../domain/entities/quality-check-result';

const toDomainResult: Record<PrismaQualityCheckResult, QualityCheckResult> = {
  [PrismaQualityCheckResult.PASSED]: QualityCheckResult.PASSED,
  [PrismaQualityCheckResult.WARNING]: QualityCheckResult.WARNING,
  [PrismaQualityCheckResult.FAILED]: QualityCheckResult.FAILED,
};

const toPrismaResult: Record<QualityCheckResult, PrismaQualityCheckResult> = {
  [QualityCheckResult.PASSED]: PrismaQualityCheckResult.PASSED,
  [QualityCheckResult.WARNING]: PrismaQualityCheckResult.WARNING,
  [QualityCheckResult.FAILED]: PrismaQualityCheckResult.FAILED,
};

export class QualityCheckMapper {
  static toDomain(row: PrismaQualityCheck): QualityCheck {
    return QualityCheck.restore({
      id: row.id,
      batchId: row.batchId,
      result: toDomainResult[row.result],
      notes: row.notes,
      checkedById: row.checkedById,
      createdAt: row.createdAt,
    });
  }

  // Append-only: no toUpdateData. createdAt comes from the domain (Clock).
  static toCreateData(check: QualityCheck): Prisma.QualityCheckUncheckedCreateInput {
    return {
      id: check.id,
      batchId: check.batchId,
      result: toPrismaResult[check.result],
      notes: check.notes,
      checkedById: check.checkedById,
      createdAt: check.createdAt,
    };
  }
}
