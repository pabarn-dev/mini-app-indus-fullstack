import { Batch } from '../../domain/entities/batch';

export interface BatchRepository {
  create(batch: Batch): Promise<Batch>;
  findById(id: string): Promise<Batch | null>;
  findByProductionOrderId(productionOrderId: string): Promise<Batch[]>;
  update(batch: Batch): Promise<Batch>;
}

export const BATCH_REPOSITORY = Symbol('BatchRepository');
