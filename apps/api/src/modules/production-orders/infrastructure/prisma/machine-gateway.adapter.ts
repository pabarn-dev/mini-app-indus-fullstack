import { MachineRepository } from '../../../machines/application/ports/machine.repository';
import { MachineGateway, MachineSnapshot } from '../../application/ports/machine-gateway';

// Bridges to the Machines module via its repository port. Returns only the
// Production Orders read model — no Prisma type, no Machine entity exposed.
export class MachineGatewayAdapter implements MachineGateway {
  constructor(private readonly machines: MachineRepository) {}

  async findById(machineId: string): Promise<MachineSnapshot | null> {
    const machine = await this.machines.findById(machineId);
    if (machine === null) {
      return null;
    }
    return {
      id: machine.id,
      status: machine.status,
      isUsable: machine.isUsableForProduction(),
    };
  }
}
