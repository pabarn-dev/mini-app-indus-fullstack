import { ProductionOrderRepository } from '../../../production-orders/application/ports/production-order.repository';
import {
  ProductionOrderGateway,
  ProductionOrderSnapshot,
} from '../../application/ports/production-order-gateway';

// Bridges to the Production Orders module via its repository port. Returns only
// the Batches read model — no Prisma type, no ProductionOrder entity exposed.
export class ProductionOrderGatewayAdapter implements ProductionOrderGateway {
  constructor(private readonly orders: ProductionOrderRepository) {}

  async findById(id: string): Promise<ProductionOrderSnapshot | null> {
    const order = await this.orders.findById(id);
    if (order === null) {
      return null;
    }
    return { id: order.id, status: order.status };
  }
}
