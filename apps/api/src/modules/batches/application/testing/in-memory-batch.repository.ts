import { Batch } from '../../domain/entities/batch';
import { BatchRepository } from '../ports/batch.repository';

export class InMemoryBatchRepository implements BatchRepository {
  private readonly batches = new Map<string, Batch>();

  create(batch: Batch): Promise<Batch> {
    this.batches.set(batch.id, batch);
    return Promise.resolve(batch);
  }

  findById(id: string): Promise<Batch | null> {
    return Promise.resolve(this.batches.get(id) ?? null);
  }

  findByProductionOrderId(productionOrderId: string): Promise<Batch[]> {
    const found = [...this.batches.values()].filter(
      (batch) => batch.productionOrderId === productionOrderId,
    );
    return Promise.resolve(found);
  }

  update(batch: Batch): Promise<Batch> {
    this.batches.set(batch.id, batch);
    return Promise.resolve(batch);
  }
}
