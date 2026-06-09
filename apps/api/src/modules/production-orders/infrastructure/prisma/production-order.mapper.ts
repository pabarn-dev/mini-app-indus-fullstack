import {
  Prisma,
  ProductionOrderStatus as PrismaProductionOrderStatus,
  type ProductionOrder as PrismaProductionOrder,
} from '@prisma/client';
import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderStatus } from '../../domain/entities/production-order-status';

const toDomainStatus: Record<PrismaProductionOrderStatus, ProductionOrderStatus> = {
  [PrismaProductionOrderStatus.DRAFT]: ProductionOrderStatus.DRAFT,
  [PrismaProductionOrderStatus.PLANNED]: ProductionOrderStatus.PLANNED,
  [PrismaProductionOrderStatus.IN_PROGRESS]: ProductionOrderStatus.IN_PROGRESS,
  [PrismaProductionOrderStatus.COMPLETED]: ProductionOrderStatus.COMPLETED,
  [PrismaProductionOrderStatus.CANCELLED]: ProductionOrderStatus.CANCELLED,
};

const toPrismaStatus: Record<ProductionOrderStatus, PrismaProductionOrderStatus> = {
  [ProductionOrderStatus.DRAFT]: PrismaProductionOrderStatus.DRAFT,
  [ProductionOrderStatus.PLANNED]: PrismaProductionOrderStatus.PLANNED,
  [ProductionOrderStatus.IN_PROGRESS]: PrismaProductionOrderStatus.IN_PROGRESS,
  [ProductionOrderStatus.COMPLETED]: PrismaProductionOrderStatus.COMPLETED,
  [ProductionOrderStatus.CANCELLED]: PrismaProductionOrderStatus.CANCELLED,
};

export class ProductionOrderMapper {
  static toDomain(row: PrismaProductionOrder): ProductionOrder {
    return ProductionOrder.restore({
      id: row.id,
      reference: row.reference,
      status: toDomainStatus[row.status],
      targetQuantity: row.targetQuantity,
      machineId: row.machineId,
      createdById: row.createdById,
      plannedAt: row.plannedAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  // createdAt/updatedAt come from the domain (Clock) — persisted as-is.
  static toCreateData(order: ProductionOrder): Prisma.ProductionOrderUncheckedCreateInput {
    return {
      id: order.id,
      reference: order.reference,
      status: toPrismaStatus[order.status],
      targetQuantity: order.targetQuantity,
      machineId: order.machineId,
      createdById: order.createdById,
      plannedAt: order.plannedAt,
      startedAt: order.startedAt,
      completedAt: order.completedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  // Only transition-affected fields; updatedAt left to Prisma @updatedAt.
  static toUpdateData(order: ProductionOrder): Prisma.ProductionOrderUpdateInput {
    return {
      status: toPrismaStatus[order.status],
      plannedAt: order.plannedAt,
      startedAt: order.startedAt,
      completedAt: order.completedAt,
    };
  }
}
