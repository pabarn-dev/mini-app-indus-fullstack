import { Prisma, type Batch as PrismaBatch } from '@prisma/client';
import { Batch } from '../../domain/entities/batch';

export class BatchMapper {
  static toDomain(row: PrismaBatch): Batch {
    return Batch.restore({
      id: row.id,
      productionOrderId: row.productionOrderId,
      sequence: row.sequence,
      quantityProduced: row.quantityProduced,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  // createdAt/updatedAt come from the domain (Clock) — persisted as-is.
  static toCreateData(batch: Batch): Prisma.BatchUncheckedCreateInput {
    return {
      id: batch.id,
      productionOrderId: batch.productionOrderId,
      sequence: batch.sequence,
      quantityProduced: batch.quantityProduced,
      startedAt: batch.startedAt,
      completedAt: batch.completedAt,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    };
  }

  // Only mutable fields; updatedAt left to Prisma @updatedAt.
  static toUpdateData(batch: Batch): Prisma.BatchUpdateInput {
    return {
      quantityProduced: batch.quantityProduced,
      completedAt: batch.completedAt,
    };
  }
}
