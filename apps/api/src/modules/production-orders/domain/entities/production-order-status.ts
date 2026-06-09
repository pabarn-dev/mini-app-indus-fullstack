// Domain-owned status, independent from the Prisma enum (mapped in infrastructure).
export const ProductionOrderStatus = {
  DRAFT: 'DRAFT',
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type ProductionOrderStatus =
  (typeof ProductionOrderStatus)[keyof typeof ProductionOrderStatus];
