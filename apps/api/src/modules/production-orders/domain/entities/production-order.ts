import { InvalidProductionOrderError } from '../errors/invalid-production-order.error';
import { InvalidProductionOrderTransitionError } from '../errors/invalid-production-order-transition.error';
import { ProductionOrderStatus } from './production-order-status';

export interface ProductionOrderProps {
  readonly id: string;
  readonly reference: string;
  readonly status: ProductionOrderStatus;
  readonly targetQuantity: number;
  readonly machineId: string;
  readonly createdById: string | null;
  readonly plannedAt: Date | null;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Business inputs for a brand-new order. id/timestamps are provided by the caller.
export interface CreateProductionOrderProps {
  readonly id: string;
  readonly reference: string;
  readonly targetQuantity: number;
  readonly machineId: string;
  readonly createdById?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const CANCELLABLE: readonly ProductionOrderStatus[] = [
  ProductionOrderStatus.DRAFT,
  ProductionOrderStatus.PLANNED,
  ProductionOrderStatus.IN_PROGRESS,
];

export class ProductionOrder {
  private constructor(private readonly props: ProductionOrderProps) {}

  static create(input: CreateProductionOrderProps): ProductionOrder {
    const reference = input.reference.trim();
    if (reference.length === 0) {
      throw InvalidProductionOrderError.emptyReference();
    }
    if (!Number.isInteger(input.targetQuantity) || input.targetQuantity <= 0) {
      throw InvalidProductionOrderError.invalidTargetQuantity();
    }

    return new ProductionOrder({
      id: input.id,
      reference,
      status: ProductionOrderStatus.DRAFT,
      targetQuantity: input.targetQuantity,
      machineId: input.machineId,
      createdById: input.createdById ?? null,
      plannedAt: null,
      startedAt: null,
      completedAt: null,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    });
  }

  // Rehydration from persistence (used by the Prisma mapper in 4D).
  static restore(props: ProductionOrderProps): ProductionOrder {
    return new ProductionOrder(props);
  }

  plan(now: Date): ProductionOrder {
    if (this.props.status !== ProductionOrderStatus.DRAFT) {
      throw InvalidProductionOrderTransitionError.from(this.props.status, 'plan');
    }
    return new ProductionOrder({
      ...this.props,
      status: ProductionOrderStatus.PLANNED,
      plannedAt: now,
    });
  }

  start(now: Date): ProductionOrder {
    if (this.props.status !== ProductionOrderStatus.PLANNED) {
      throw InvalidProductionOrderTransitionError.from(this.props.status, 'start');
    }
    return new ProductionOrder({
      ...this.props,
      status: ProductionOrderStatus.IN_PROGRESS,
      startedAt: now,
    });
  }

  complete(now: Date): ProductionOrder {
    if (this.props.status !== ProductionOrderStatus.IN_PROGRESS) {
      throw InvalidProductionOrderTransitionError.from(this.props.status, 'complete');
    }
    return new ProductionOrder({
      ...this.props,
      status: ProductionOrderStatus.COMPLETED,
      completedAt: now,
    });
  }

  // No cancelledAt column — updatedAt (managed by persistence) records the change.
  cancel(): ProductionOrder {
    if (!CANCELLABLE.includes(this.props.status)) {
      throw InvalidProductionOrderTransitionError.from(this.props.status, 'cancel');
    }
    return new ProductionOrder({ ...this.props, status: ProductionOrderStatus.CANCELLED });
  }

  get id(): string {
    return this.props.id;
  }

  get reference(): string {
    return this.props.reference;
  }

  get status(): ProductionOrderStatus {
    return this.props.status;
  }

  get targetQuantity(): number {
    return this.props.targetQuantity;
  }

  get machineId(): string {
    return this.props.machineId;
  }

  get createdById(): string | null {
    return this.props.createdById;
  }

  get plannedAt(): Date | null {
    return this.props.plannedAt;
  }

  get startedAt(): Date | null {
    return this.props.startedAt;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
