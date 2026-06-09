import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderStatus } from '../../domain/entities/production-order-status';

export interface ProductionOrderResponse {
  id: string;
  reference: string;
  status: ProductionOrderStatus;
  targetQuantity: number;
  machineId: string;
  createdById: string | null;
  plannedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toProductionOrderResponse(order: ProductionOrder): ProductionOrderResponse {
  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    targetQuantity: order.targetQuantity,
    machineId: order.machineId,
    createdById: order.createdById,
    plannedAt: order.plannedAt === null ? null : order.plannedAt.toISOString(),
    startedAt: order.startedAt === null ? null : order.startedAt.toISOString(),
    completedAt: order.completedAt === null ? null : order.completedAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
