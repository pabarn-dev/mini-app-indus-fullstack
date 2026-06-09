import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderNotFoundError } from '../../domain/errors/production-order-not-found.error';
import { ProductionOrderRepository } from '../ports/production-order.repository';

export class GetProductionOrderByIdUseCase {
  constructor(private readonly orders: ProductionOrderRepository) {}

  async execute(id: string): Promise<ProductionOrder> {
    const order = await this.orders.findById(id);
    if (order === null) {
      throw ProductionOrderNotFoundError.byId(id);
    }
    return order;
  }
}
