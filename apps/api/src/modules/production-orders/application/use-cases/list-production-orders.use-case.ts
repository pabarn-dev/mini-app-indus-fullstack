import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderRepository } from '../ports/production-order.repository';

export class ListProductionOrdersUseCase {
  constructor(private readonly orders: ProductionOrderRepository) {}

  execute(): Promise<ProductionOrder[]> {
    return this.orders.findAll();
  }
}
