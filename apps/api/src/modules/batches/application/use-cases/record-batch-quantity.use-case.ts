import { Batch } from '../../domain/entities/batch';
import { BatchNotFoundError } from '../errors/batch-not-found.error';
import { BatchRepository } from '../ports/batch.repository';

export interface RecordBatchQuantityInput {
  readonly batchId: string;
  readonly quantity: number; // total produced quantity (set, not a delta)
}

export class RecordBatchQuantityUseCase {
  constructor(private readonly batches: BatchRepository) {}

  async execute(input: RecordBatchQuantityInput): Promise<Batch> {
    const batch = await this.batches.findById(input.batchId);
    if (batch === null) {
      throw BatchNotFoundError.byId(input.batchId);
    }

    // Domain enforces non-negative integer & "not completed".
    return this.batches.update(batch.recordQuantity(input.quantity));
  }
}
