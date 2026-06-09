import { TransactionRunner } from '../../../../shared/application/ports/transaction-runner';
import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderNotFoundError } from '../../domain/errors/production-order-not-found.error';
import { AuditAction, AuditEntityType, AuditLogWriter } from '../ports/audit-log-writer';
import { ProductionOrderRepository } from '../ports/production-order.repository';

export class CancelProductionOrderUseCase {
  constructor(
    private readonly orders: ProductionOrderRepository,
    private readonly audit: AuditLogWriter,
    private readonly transactions: TransactionRunner,
  ) {}

  async execute(id: string): Promise<ProductionOrder> {
    const order = await this.orders.findById(id);
    if (order === null) {
      throw ProductionOrderNotFoundError.byId(id);
    }

    return this.transactions.run(async () => {
      const updated = await this.orders.update(order.cancel());
      await this.audit.record({
        action: AuditAction.STATUS_CHANGE,
        entityType: AuditEntityType.PRODUCTION_ORDER,
        entityId: updated.id,
        userId: null,
        metadata: { from: order.status, to: updated.status },
      });
      return updated;
    });
  }
}
