import { Clock } from '../../../../shared/application/ports/clock';
import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderNotFoundError } from '../../domain/errors/production-order-not-found.error';
import { AuditAction, AuditEntityType, AuditLogWriter } from '../ports/audit-log-writer';
import { ProductionOrderRepository } from '../ports/production-order.repository';

export class CompleteProductionOrderUseCase {
  constructor(
    private readonly orders: ProductionOrderRepository,
    private readonly audit: AuditLogWriter,
    private readonly clock: Clock,
  ) {}

  async execute(id: string): Promise<ProductionOrder> {
    const order = await this.orders.findById(id);
    if (order === null) {
      throw ProductionOrderNotFoundError.byId(id);
    }

    const updated = await this.orders.update(order.complete(this.clock.now()));
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
