import { IsIn } from 'class-validator';
import { MachineStatus } from '../../domain/entities/machine-status';

export class UpdateMachineStatusDto {
  @IsIn(Object.values(MachineStatus))
  status!: MachineStatus;
}
