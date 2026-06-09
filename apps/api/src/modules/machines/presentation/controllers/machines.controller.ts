import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CreateMachineUseCase } from '../../application/use-cases/create-machine.use-case';
import { GetMachineByIdUseCase } from '../../application/use-cases/get-machine-by-id.use-case';
import { ListMachinesUseCase } from '../../application/use-cases/list-machines.use-case';
import { UpdateMachineStatusUseCase } from '../../application/use-cases/update-machine-status.use-case';
import { CreateMachineDto } from '../dto/create-machine.dto';
import { MachineResponse, toMachineResponse } from '../dto/machine.response';
import { UpdateMachineStatusDto } from '../dto/update-machine-status.dto';

@Controller('machines')
export class MachinesController {
  constructor(
    private readonly createMachine: CreateMachineUseCase,
    private readonly listMachines: ListMachinesUseCase,
    private readonly getMachineById: GetMachineByIdUseCase,
    private readonly updateMachineStatus: UpdateMachineStatusUseCase,
  ) {}

  @Get()
  async list(): Promise<MachineResponse[]> {
    const machines = await this.listMachines.execute();
    return machines.map(toMachineResponse);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<MachineResponse> {
    const machine = await this.getMachineById.execute(id);
    return toMachineResponse(machine);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateMachineDto): Promise<MachineResponse> {
    const machine = await this.createMachine.execute({
      code: dto.code,
      name: dto.name,
      location: dto.location ?? null,
    });
    return toMachineResponse(machine);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMachineStatusDto,
  ): Promise<MachineResponse> {
    const machine = await this.updateMachineStatus.execute({ id, status: dto.status });
    return toMachineResponse(machine);
  }
}
