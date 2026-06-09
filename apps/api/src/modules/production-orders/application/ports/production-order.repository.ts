import { ProductionOrder } from '../../domain/entities/production-order';

export interface ProductionOrderRepository {
  create(order: ProductionOrder): Promise<ProductionOrder>;
  findAll(): Promise<ProductionOrder[]>;
  findById(id: string): Promise<ProductionOrder | null>;
  findByReference(reference: string): Promise<ProductionOrder | null>;
  update(order: ProductionOrder): Promise<ProductionOrder>;
}

export const PRODUCTION_ORDER_REPOSITORY = Symbol('ProductionOrderRepository');
