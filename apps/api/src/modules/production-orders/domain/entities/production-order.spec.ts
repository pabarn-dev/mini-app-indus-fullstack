import { describe, expect, it } from 'vitest';
import { InvalidProductionOrderError } from '../errors/invalid-production-order.error';
import { InvalidProductionOrderTransitionError } from '../errors/invalid-production-order-transition.error';
import { ProductionOrder, type CreateProductionOrderProps } from './production-order';
import { ProductionOrderStatus } from './production-order-status';

const now = new Date('2026-01-01T00:00:00Z');

const baseInput: CreateProductionOrderProps = {
  id: 'po-1',
  reference: 'PO-2026-0001',
  targetQuantity: 100,
  machineId: 'machine-1',
  createdById: 'user-1',
  createdAt: now,
  updatedAt: now,
};

describe('ProductionOrder', () => {
  describe('create (invariants)', () => {
    it('creates a DRAFT order with null lifecycle dates', () => {
      const order = ProductionOrder.create(baseInput);

      expect(order.status).toBe(ProductionOrderStatus.DRAFT);
      expect(order.plannedAt).toBeNull();
      expect(order.startedAt).toBeNull();
      expect(order.completedAt).toBeNull();
    });

    it('trims the reference', () => {
      expect(ProductionOrder.create({ ...baseInput, reference: '  PO-9  ' }).reference).toBe(
        'PO-9',
      );
    });

    it('rejects an empty reference', () => {
      expect(() => ProductionOrder.create({ ...baseInput, reference: '   ' })).toThrow(
        InvalidProductionOrderError,
      );
    });

    it('rejects a non-positive or non-integer target quantity', () => {
      expect(() => ProductionOrder.create({ ...baseInput, targetQuantity: 0 })).toThrow(
        InvalidProductionOrderError,
      );
      expect(() => ProductionOrder.create({ ...baseInput, targetQuantity: -5 })).toThrow(
        InvalidProductionOrderError,
      );
      expect(() => ProductionOrder.create({ ...baseInput, targetQuantity: 1.5 })).toThrow(
        InvalidProductionOrderError,
      );
    });
  });

  describe('transitions (allowed)', () => {
    it('DRAFT → plan → PLANNED sets plannedAt', () => {
      const planned = ProductionOrder.create(baseInput).plan(now);

      expect(planned.status).toBe(ProductionOrderStatus.PLANNED);
      expect(planned.plannedAt).toEqual(now);
    });

    it('PLANNED → start → IN_PROGRESS sets startedAt', () => {
      const started = ProductionOrder.create(baseInput).plan(now).start(now);

      expect(started.status).toBe(ProductionOrderStatus.IN_PROGRESS);
      expect(started.startedAt).toEqual(now);
    });

    it('IN_PROGRESS → complete → COMPLETED sets completedAt', () => {
      const completed = ProductionOrder.create(baseInput).plan(now).start(now).complete(now);

      expect(completed.status).toBe(ProductionOrderStatus.COMPLETED);
      expect(completed.completedAt).toEqual(now);
    });

    it('cancels from DRAFT, PLANNED and IN_PROGRESS', () => {
      const draft = ProductionOrder.create(baseInput);

      expect(draft.cancel().status).toBe(ProductionOrderStatus.CANCELLED);
      expect(draft.plan(now).cancel().status).toBe(ProductionOrderStatus.CANCELLED);
      expect(draft.plan(now).start(now).cancel().status).toBe(ProductionOrderStatus.CANCELLED);
    });
  });

  describe('transitions (forbidden)', () => {
    it('cannot plan unless DRAFT', () => {
      const planned = ProductionOrder.create(baseInput).plan(now);

      expect(() => planned.plan(now)).toThrow(InvalidProductionOrderTransitionError);
    });

    it('cannot start unless PLANNED', () => {
      expect(() => ProductionOrder.create(baseInput).start(now)).toThrow(
        InvalidProductionOrderTransitionError,
      );
    });

    it('cannot complete unless IN_PROGRESS', () => {
      expect(() => ProductionOrder.create(baseInput).plan(now).complete(now)).toThrow(
        InvalidProductionOrderTransitionError,
      );
    });

    it('cannot transition from terminal states', () => {
      const completed = ProductionOrder.create(baseInput).plan(now).start(now).complete(now);
      const cancelled = ProductionOrder.create(baseInput).cancel();

      expect(() => completed.cancel()).toThrow(InvalidProductionOrderTransitionError);
      expect(() => cancelled.plan(now)).toThrow(InvalidProductionOrderTransitionError);
    });
  });

  describe('immutability', () => {
    it('plan returns a new instance and leaves the original unchanged', () => {
      const draft = ProductionOrder.create(baseInput);
      const planned = draft.plan(now);

      expect(planned).not.toBe(draft);
      expect(draft.status).toBe(ProductionOrderStatus.DRAFT);
      expect(draft.plannedAt).toBeNull();
    });
  });
});
