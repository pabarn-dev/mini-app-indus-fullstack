import { InvalidMachineError } from '../errors/invalid-machine.error';
import { MachineStatus } from './machine-status';

export interface MachineProps {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: MachineStatus;
  readonly location: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Business inputs for a brand-new machine. id/timestamps are provided by the
// caller (DB generates uuid(7) and manages updatedAt) — the domain never
// generates ids nor depends on the database.
export interface CreateMachineProps {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly location?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class Machine {
  private constructor(private readonly props: MachineProps) {}

  static create(input: CreateMachineProps): Machine {
    const code = input.code.trim();
    const name = input.name.trim();

    if (code.length === 0) {
      throw InvalidMachineError.emptyCode();
    }
    if (name.length === 0) {
      throw InvalidMachineError.emptyName();
    }

    return new Machine({
      id: input.id,
      code,
      name,
      status: MachineStatus.ACTIVE,
      location: input.location ?? null,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    });
  }

  // Rehydration from persistence (used by the Prisma mapper in 3D).
  static restore(props: MachineProps): Machine {
    return new Machine(props);
  }

  changeStatus(next: MachineStatus): Machine {
    if (next === this.props.status) {
      return this;
    }
    return new Machine({ ...this.props, status: next });
  }

  isUsableForProduction(): boolean {
    return this.props.status === MachineStatus.ACTIVE;
  }

  get id(): string {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get status(): MachineStatus {
    return this.props.status;
  }

  get location(): string | null {
    return this.props.location;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
