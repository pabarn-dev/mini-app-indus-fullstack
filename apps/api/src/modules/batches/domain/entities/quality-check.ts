import { InvalidQualityCheckError } from '../errors/invalid-quality-check.error';
import { isQualityCheckResult, QualityCheckResult } from './quality-check-result';

export interface QualityCheckProps {
  readonly id: string;
  readonly batchId: string;
  readonly result: QualityCheckResult;
  readonly notes: string | null;
  readonly checkedById: string | null;
  readonly createdAt: Date;
}

// Business inputs for a brand-new check. Append-only: created once, then frozen.
export interface CreateQualityCheckProps {
  readonly id: string;
  readonly batchId: string;
  readonly result: string;
  readonly notes?: string | null | undefined;
  readonly checkedById?: string | null | undefined;
  readonly createdAt: Date;
}

function normalizeNotes(notes: string | null | undefined): string | null {
  if (notes === null || notes === undefined) {
    return null;
  }
  const trimmed = notes.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export class QualityCheck {
  private constructor(private readonly props: QualityCheckProps) {}

  static create(input: CreateQualityCheckProps): QualityCheck {
    if (!isQualityCheckResult(input.result)) {
      throw InvalidQualityCheckError.invalidResult();
    }

    return new QualityCheck({
      id: input.id,
      batchId: input.batchId,
      result: input.result,
      notes: normalizeNotes(input.notes),
      checkedById: input.checkedById ?? null,
      createdAt: input.createdAt,
    });
  }

  // Rehydration from persistence (used by the Prisma mapper in a later lot).
  static restore(props: QualityCheckProps): QualityCheck {
    return new QualityCheck(props);
  }

  get id(): string {
    return this.props.id;
  }

  get batchId(): string {
    return this.props.batchId;
  }

  get result(): QualityCheckResult {
    return this.props.result;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get checkedById(): string | null {
    return this.props.checkedById;
  }

  get isFailed(): boolean {
    return this.props.result === QualityCheckResult.FAILED;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
