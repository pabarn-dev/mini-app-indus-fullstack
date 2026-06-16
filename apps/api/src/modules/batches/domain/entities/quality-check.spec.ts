import { describe, expect, it } from 'vitest';
import { InvalidQualityCheckError } from '../errors/invalid-quality-check.error';
import { QualityCheck, type CreateQualityCheckProps } from './quality-check';
import { QualityCheckResult } from './quality-check-result';

const now = new Date('2026-01-01T00:00:00Z');

const baseInput: CreateQualityCheckProps = {
  id: 'qc-1',
  batchId: 'batch-1',
  result: QualityCheckResult.PASSED,
  createdAt: now,
};

describe('QualityCheck', () => {
  describe('create (invariants)', () => {
    it('accepts PASSED, WARNING and FAILED', () => {
      expect(QualityCheck.create({ ...baseInput, result: 'PASSED' }).result).toBe('PASSED');
      expect(QualityCheck.create({ ...baseInput, result: 'WARNING' }).result).toBe('WARNING');

      const failed = QualityCheck.create({ ...baseInput, result: 'FAILED' });
      expect(failed.result).toBe('FAILED');
      expect(failed.isFailed).toBe(true);
    });

    it('rejects an unknown result', () => {
      expect(() => QualityCheck.create({ ...baseInput, result: 'UNKNOWN' })).toThrow(
        InvalidQualityCheckError,
      );
    });

    it('normalizes empty or whitespace notes to null', () => {
      expect(QualityCheck.create({ ...baseInput, notes: '   ' }).notes).toBeNull();
      expect(QualityCheck.create({ ...baseInput, notes: undefined }).notes).toBeNull();
      expect(QualityCheck.create({ ...baseInput, notes: null }).notes).toBeNull();
    });

    it('trims meaningful notes', () => {
      expect(QualityCheck.create({ ...baseInput, notes: '  surface scratch  ' }).notes).toBe(
        'surface scratch',
      );
    });

    it('defaults checkedById to null when absent', () => {
      expect(QualityCheck.create(baseInput).checkedById).toBeNull();
    });
  });
});
