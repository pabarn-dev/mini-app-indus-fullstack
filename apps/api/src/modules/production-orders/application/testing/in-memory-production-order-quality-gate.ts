import { ProductionOrderQualityGate } from '../ports/production-order-quality-gate';

export class InMemoryProductionOrderQualityGate implements ProductionOrderQualityGate {
  private readonly failed = new Set<string>();

  markFailed(productionOrderId: string): void {
    this.failed.add(productionOrderId);
  }

  hasFailedQualityCheck(productionOrderId: string): Promise<boolean> {
    return Promise.resolve(this.failed.has(productionOrderId));
  }
}
