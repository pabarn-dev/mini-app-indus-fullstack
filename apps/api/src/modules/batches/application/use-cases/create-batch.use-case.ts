import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { Batch } from '../../domain/entities/batch';
import { ProductionOrderNotFoundForBatchError } from '../errors/production-order-not-found-for-batch.error';
import { ProductionOrderNotReadyForBatchError } from '../errors/production-order-not-ready-for-batch.error';
import { BatchRepository } from '../ports/batch.repository';
import { ProductionOrderGateway } from '../ports/production-order-gateway';

export interface CreateBatchInput {
  readonly productionOrderId: string;
}

const IN_PROGRESS_STATUS = 'IN_PROGRESS';

export class CreateBatchUseCase {
  constructor(
    private readonly batches: BatchRepository,
    private readonly orders: ProductionOrderGateway,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateBatchInput): Promise<Batch> {
    const order = await this.orders.findById(input.productionOrderId);
    if (order === null) {
      throw ProductionOrderNotFoundForBatchError.byId(input.productionOrderId);
    }
    if (order.status !== IN_PROGRESS_STATUS) {
      throw ProductionOrderNotReadyForBatchError.notInProgress(order.id, order.status);
    }

    const existing = await this.batches.findByProductionOrderId(order.id);
    const sequence = existing.reduce((max, batch) => Math.max(max, batch.sequence), 0) + 1;

    const now = this.clock.now();
    const batch = Batch.create({
      id: this.idGenerator.generate(),
      productionOrderId: order.id,
      sequence,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return this.batches.create(batch);
  }
}
