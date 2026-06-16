import { Batch } from '../../domain/entities/batch';
import { BatchNotFoundError } from '../errors/batch-not-found.error';
import { BatchRepository } from '../ports/batch.repository';

export class GetBatchByIdUseCase {
  constructor(private readonly batches: BatchRepository) {}

  async execute(id: string): Promise<Batch> {
    const batch = await this.batches.findById(id);
    if (batch === null) {
      throw BatchNotFoundError.byId(id);
    }
    return batch;
  }
}
