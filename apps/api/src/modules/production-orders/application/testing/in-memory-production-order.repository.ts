import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderRepository } from '../ports/production-order.repository';

export class InMemoryProductionOrderRepository implements ProductionOrderRepository {
  private readonly orders = new Map<string, ProductionOrder>();

  create(order: ProductionOrder): Promise<ProductionOrder> {
    this.orders.set(order.id, order);
    return Promise.resolve(order);
  }

  findAll(): Promise<ProductionOrder[]> {
    return Promise.resolve([...this.orders.values()]);
  }

  findById(id: string): Promise<ProductionOrder | null> {
    return Promise.resolve(this.orders.get(id) ?? null);
  }

  findByReference(reference: string): Promise<ProductionOrder | null> {
    const found = [...this.orders.values()].find((order) => order.reference === reference);
    return Promise.resolve(found ?? null);
  }

  update(order: ProductionOrder): Promise<ProductionOrder> {
    this.orders.set(order.id, order);
    return Promise.resolve(order);
  }
}
