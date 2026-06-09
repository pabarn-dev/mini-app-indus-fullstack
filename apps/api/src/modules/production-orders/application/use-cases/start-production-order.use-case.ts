import { Clock } from '../../../../shared/application/ports/clock';
import { ProductionOrder } from '../../domain/entities/production-order';
import { MachineNotFoundForProductionOrderError } from '../../domain/errors/machine-not-found-for-production-order.error';
import { MachineNotUsableForProductionOrderError } from '../../domain/errors/machine-not-usable-for-production-order.error';
import { ProductionOrderNotFoundError } from '../../domain/errors/production-order-not-found.error';
import { AuditAction, AuditEntityType, AuditLogWriter } from '../ports/audit-log-writer';
import { MachineGateway } from '../ports/machine-gateway';
import { ProductionOrderRepository } from '../ports/production-order.repository';

export class StartProductionOrderUseCase {
  constructor(
    private readonly orders: ProductionOrderRepository,
    private readonly machines: MachineGateway,
    private readonly audit: AuditLogWriter,
    private readonly clock: Clock,
  ) {}

  async execute(id: string): Promise<ProductionOrder> {
    const order = await this.orders.findById(id);
    if (order === null) {
      throw ProductionOrderNotFoundError.byId(id);
    }

    const machine = await this.machines.findById(order.machineId);
    if (machine === null) {
      throw MachineNotFoundForProductionOrderError.byId(order.machineId);
    }
    if (!machine.isUsable) {
      throw MachineNotUsableForProductionOrderError.notActive(order.machineId);
    }

    const updated = await this.orders.update(order.start(this.clock.now()));
    await this.audit.record({
      action: AuditAction.STATUS_CHANGE,
      entityType: AuditEntityType.PRODUCTION_ORDER,
      entityId: updated.id,
      userId: null,
      metadata: { from: order.status, to: updated.status },
    });
    return updated;
  }
}
