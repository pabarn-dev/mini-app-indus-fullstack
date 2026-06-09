import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { ProductionOrder } from '../../domain/entities/production-order';
import { DuplicateProductionOrderReferenceError } from '../../domain/errors/duplicate-production-order-reference.error';
import { MachineNotFoundForProductionOrderError } from '../../domain/errors/machine-not-found-for-production-order.error';
import { MachineNotUsableForProductionOrderError } from '../../domain/errors/machine-not-usable-for-production-order.error';
import { MachineGateway } from '../ports/machine-gateway';
import { ProductionOrderRepository } from '../ports/production-order.repository';

export interface CreateProductionOrderInput {
  readonly reference: string;
  readonly targetQuantity: number;
  readonly machineId: string;
  readonly createdById?: string | null;
}

const DISABLED_MACHINE_STATUS = 'DISABLED';

export class CreateProductionOrderUseCase {
  constructor(
    private readonly orders: ProductionOrderRepository,
    private readonly machines: MachineGateway,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateProductionOrderInput): Promise<ProductionOrder> {
    const now = this.clock.now();
    // Domain validates & normalizes (trim reference, positive quantity).
    const order = ProductionOrder.create({
      id: this.idGenerator.generate(),
      reference: input.reference,
      targetQuantity: input.targetQuantity,
      machineId: input.machineId,
      createdById: input.createdById ?? null,
      createdAt: now,
      updatedAt: now,
    });

    const machine = await this.machines.findById(order.machineId);
    if (machine === null) {
      throw MachineNotFoundForProductionOrderError.byId(order.machineId);
    }
    if (machine.status === DISABLED_MACHINE_STATUS) {
      throw MachineNotUsableForProductionOrderError.disabled(order.machineId);
    }

    const existing = await this.orders.findByReference(order.reference);
    if (existing !== null) {
      throw DuplicateProductionOrderReferenceError.forReference(order.reference);
    }

    return this.orders.create(order);
  }
}
