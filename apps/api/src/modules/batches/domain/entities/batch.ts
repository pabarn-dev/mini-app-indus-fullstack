import { BatchAlreadyCompletedError } from '../errors/batch-already-completed.error';
import { InvalidBatchError } from '../errors/invalid-batch.error';
import { InvalidQuantityError } from '../errors/invalid-quantity.error';

export interface BatchProps {
  readonly id: string;
  readonly productionOrderId: string;
  readonly sequence: number;
  readonly quantityProduced: number;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Business inputs for a brand-new batch. id/sequence/timestamps are provided by the caller.
export interface CreateBatchProps {
  readonly id: string;
  readonly productionOrderId: string;
  readonly sequence: number;
  readonly startedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

function assertNonNegativeInteger(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw InvalidQuantityError.notNonNegativeInteger();
  }
}

export class Batch {
  private constructor(private readonly props: BatchProps) {}

  static create(input: CreateBatchProps): Batch {
    if (!Number.isInteger(input.sequence) || input.sequence < 1) {
      throw InvalidBatchError.invalidSequence();
    }

    return new Batch({
      id: input.id,
      productionOrderId: input.productionOrderId,
      sequence: input.sequence,
      quantityProduced: 0,
      startedAt: input.startedAt,
      completedAt: null,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    });
  }

  // Rehydration from persistence (used by the Prisma mapper in a later lot).
  static restore(props: BatchProps): Batch {
    return new Batch(props);
  }

  // Replaces the produced quantity (set, not increment). updatedAt is managed by persistence.
  recordQuantity(quantity: number): Batch {
    if (this.props.completedAt !== null) {
      throw BatchAlreadyCompletedError.cannot('record quantity on');
    }
    assertNonNegativeInteger(quantity);

    return new Batch({ ...this.props, quantityProduced: quantity });
  }

  complete(now: Date): Batch {
    if (this.props.completedAt !== null) {
      throw BatchAlreadyCompletedError.cannot('complete');
    }
    return new Batch({ ...this.props, completedAt: now });
  }

  get id(): string {
    return this.props.id;
  }

  get productionOrderId(): string {
    return this.props.productionOrderId;
  }

  get sequence(): number {
    return this.props.sequence;
  }

  get quantityProduced(): number {
    return this.props.quantityProduced;
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get isCompleted(): boolean {
    return this.props.completedAt !== null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
