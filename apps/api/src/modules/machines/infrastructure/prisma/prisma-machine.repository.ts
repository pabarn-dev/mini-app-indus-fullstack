import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Machine } from '../../domain/entities/machine';
import { MachineRepository } from '../../application/ports/machine.repository';
import { MachineMapper } from './machine.mapper';

@Injectable()
export class PrismaMachineRepository implements MachineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(machine: Machine): Promise<Machine> {
    const row = await this.prisma.machine.create({ data: MachineMapper.toCreateData(machine) });
    return MachineMapper.toDomain(row);
  }

  async findAll(): Promise<Machine[]> {
    const rows = await this.prisma.machine.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map((row) => MachineMapper.toDomain(row));
  }

  async findById(id: string): Promise<Machine | null> {
    const row = await this.prisma.machine.findUnique({ where: { id } });
    return row === null ? null : MachineMapper.toDomain(row);
  }

  async findByCode(code: string): Promise<Machine | null> {
    const row = await this.prisma.machine.findUnique({ where: { code } });
    return row === null ? null : MachineMapper.toDomain(row);
  }

  async update(machine: Machine): Promise<Machine> {
    const row = await this.prisma.machine.update({
      where: { id: machine.id },
      data: MachineMapper.toUpdateData(machine),
    });
    return MachineMapper.toDomain(row);
  }
}
