// Domain-owned result, independent from the Prisma enum (mapped in infrastructure).
export const QualityCheckResult = {
  PASSED: 'PASSED',
  WARNING: 'WARNING',
  FAILED: 'FAILED',
} as const;

export type QualityCheckResult = (typeof QualityCheckResult)[keyof typeof QualityCheckResult];

export function isQualityCheckResult(value: string): value is QualityCheckResult {
  return (
    value === QualityCheckResult.PASSED ||
    value === QualityCheckResult.WARNING ||
    value === QualityCheckResult.FAILED
  );
}
