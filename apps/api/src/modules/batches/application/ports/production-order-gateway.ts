// Minimal read model of a production order, owned by Batches. No Prisma type,
// no ProductionOrder entity import — the adapter (5D) bridges to Production Orders.
export interface ProductionOrderSnapshot {
  id: string;
  status: string; // domain status string, e.g. "IN_PROGRESS"
}

export interface ProductionOrderGateway {
  findById(id: string): Promise<ProductionOrderSnapshot | null>;
}

export const PRODUCTION_ORDER_GATEWAY = Symbol('ProductionOrderGateway');
