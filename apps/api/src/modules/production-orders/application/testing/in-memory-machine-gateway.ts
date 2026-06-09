import { MachineGateway, MachineSnapshot } from '../ports/machine-gateway';

export class InMemoryMachineGateway implements MachineGateway {
  private readonly machines = new Map<string, MachineSnapshot>();

  set(snapshot: MachineSnapshot): void {
    this.machines.set(snapshot.id, snapshot);
  }

  findById(machineId: string): Promise<MachineSnapshot | null> {
    return Promise.resolve(this.machines.get(machineId) ?? null);
  }
}
