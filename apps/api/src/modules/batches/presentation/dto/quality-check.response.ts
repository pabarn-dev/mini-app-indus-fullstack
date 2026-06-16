import { QualityCheck } from '../../domain/entities/quality-check';
import { QualityCheckResult } from '../../domain/entities/quality-check-result';

export interface QualityCheckResponse {
  id: string;
  batchId: string;
  result: QualityCheckResult;
  notes: string | null;
  checkedById: string | null;
  createdAt: string;
}

export function toQualityCheckResponse(check: QualityCheck): QualityCheckResponse {
  return {
    id: check.id,
    batchId: check.batchId,
    result: check.result,
    notes: check.notes,
    checkedById: check.checkedById,
    createdAt: check.createdAt.toISOString(),
  };
}
