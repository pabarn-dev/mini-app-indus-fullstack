import { Batch } from '../../domain/entities/batch';
import { BatchRepository } from '../ports/batch.repository';

export class ListBatchesUseCase {
  constructor(private readonly batches: BatchRepository) {}

  execute(productionOrderId: string): Promise<Batch[]> {
    return this.batches.findByProductionOrderId(productionOrderId);
  }
}
