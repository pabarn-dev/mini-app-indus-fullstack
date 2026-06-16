import { Batch } from '../../domain/entities/batch';

export interface BatchResponse {
  id: string;
  productionOrderId: string;
  sequence: number;
  quantityProduced: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toBatchResponse(batch: Batch): BatchResponse {
  return {
    id: batch.id,
    productionOrderId: batch.productionOrderId,
    sequence: batch.sequence,
    quantityProduced: batch.quantityProduced,
    startedAt: batch.startedAt.toISOString(),
    completedAt: batch.completedAt === null ? null : batch.completedAt.toISOString(),
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
  };
}
