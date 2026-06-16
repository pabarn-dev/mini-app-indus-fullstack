import { ProductionOrderGateway, ProductionOrderSnapshot } from '../ports/production-order-gateway';

export class InMemoryProductionOrderGateway implements ProductionOrderGateway {
  private readonly snapshots = new Map<string, ProductionOrderSnapshot>();

  set(snapshot: ProductionOrderSnapshot): void {
    this.snapshots.set(snapshot.id, snapshot);
  }

  findById(id: string): Promise<ProductionOrderSnapshot | null> {
    return Promise.resolve(this.snapshots.get(id) ?? null);
  }
}
