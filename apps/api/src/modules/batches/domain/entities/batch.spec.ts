import { describe, expect, it } from 'vitest';
import { BatchAlreadyCompletedError } from '../errors/batch-already-completed.error';
import { InvalidBatchError } from '../errors/invalid-batch.error';
import { InvalidQuantityError } from '../errors/invalid-quantity.error';
import { Batch, type CreateBatchProps } from './batch';

const now = new Date('2026-01-01T00:00:00Z');

const baseInput: CreateBatchProps = {
  id: 'batch-1',
  productionOrderId: 'po-1',
  sequence: 1,
  startedAt: now,
  createdAt: now,
  updatedAt: now,
};

describe('Batch', () => {
  describe('create (invariants)', () => {
    it('creates a batch with quantityProduced 0 and completedAt null', () => {
      const batch = Batch.create(baseInput);

      expect(batch.quantityProduced).toBe(0);
      expect(batch.completedAt).toBeNull();
      expect(batch.isCompleted).toBe(false);
    });

    it('rejects a non-positive or non-integer sequence', () => {
      expect(() => Batch.create({ ...baseInput, sequence: 0 })).toThrow(InvalidBatchError);
      expect(() => Batch.create({ ...baseInput, sequence: -1 })).toThrow(InvalidBatchError);
      expect(() => Batch.create({ ...baseInput, sequence: 1.5 })).toThrow(InvalidBatchError);
    });
  });

  describe('recordQuantity (set, not increment)', () => {
    it('replaces the produced quantity', () => {
      const batch = Batch.create(baseInput).recordQuantity(40).recordQuantity(75);

      expect(batch.quantityProduced).toBe(75);
    });

    it('accepts zero', () => {
      expect(Batch.create(baseInput).recordQuantity(0).quantityProduced).toBe(0);
    });

    it('rejects a negative or non-integer quantity', () => {
      const batch = Batch.create(baseInput);

      expect(() => batch.recordQuantity(-1)).toThrow(InvalidQuantityError);
      expect(() => batch.recordQuantity(2.5)).toThrow(InvalidQuantityError);
    });

    it('rejects recording on a completed batch', () => {
      const completed = Batch.create(baseInput).complete(now);

      expect(() => completed.recordQuantity(10)).toThrow(BatchAlreadyCompletedError);
    });

    it('does not touch updatedAt (managed by persistence)', () => {
      const batch = Batch.create(baseInput).recordQuantity(10);

      expect(batch.updatedAt).toEqual(now);
    });
  });

  describe('complete', () => {
    it('sets completedAt', () => {
      const completed = Batch.create(baseInput).complete(now);

      expect(completed.completedAt).toEqual(now);
      expect(completed.isCompleted).toBe(true);
    });

    it('rejects completing an already completed batch', () => {
      const completed = Batch.create(baseInput).complete(now);

      expect(() => completed.complete(now)).toThrow(BatchAlreadyCompletedError);
    });
  });

  describe('immutability', () => {
    it('recordQuantity returns a new instance and leaves the original unchanged', () => {
      const batch = Batch.create(baseInput);
      const updated = batch.recordQuantity(50);

      expect(updated).not.toBe(batch);
      expect(batch.quantityProduced).toBe(0);
    });

    it('complete returns a new instance and leaves the original unchanged', () => {
      const batch = Batch.create(baseInput);
      const completed = batch.complete(now);

      expect(completed).not.toBe(batch);
      expect(batch.completedAt).toBeNull();
    });
  });
});
