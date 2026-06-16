// Minimal boolean read model owned by Production Orders. Tells whether an order
// has at least one batch with a FAILED quality check. No Prisma type, no Batches
// module import — the adapter (infrastructure) bridges via Prisma.
export interface ProductionOrderQualityGate {
  hasFailedQualityCheck(productionOrderId: string): Promise<boolean>;
}

export const PRODUCTION_ORDER_QUALITY_GATE = Symbol('ProductionOrderQualityGate');
