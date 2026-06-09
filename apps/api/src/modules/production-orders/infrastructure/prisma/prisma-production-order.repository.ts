import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ProductionOrderRepository } from '../../application/ports/production-order.repository';
import { ProductionOrder } from '../../domain/entities/production-order';
import { ProductionOrderMapper } from './production-order.mapper';

@Injectable()
export class PrismaProductionOrderRepository implements ProductionOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(order: ProductionOrder): Promise<ProductionOrder> {
    const row = await this.prisma.db.productionOrder.create({
      data: ProductionOrderMapper.toCreateData(order),
    });
    return ProductionOrderMapper.toDomain(row);
  }

  async findAll(): Promise<ProductionOrder[]> {
    const rows = await this.prisma.db.productionOrder.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map((row) => ProductionOrderMapper.toDomain(row));
  }

  async findById(id: string): Promise<ProductionOrder | null> {
    const row = await this.prisma.db.productionOrder.findUnique({ where: { id } });
    return row === null ? null : ProductionOrderMapper.toDomain(row);
  }

  async findByReference(reference: string): Promise<ProductionOrder | null> {
    const row = await this.prisma.db.productionOrder.findUnique({ where: { reference } });
    return row === null ? null : ProductionOrderMapper.toDomain(row);
  }

  async update(order: ProductionOrder): Promise<ProductionOrder> {
    const row = await this.prisma.db.productionOrder.update({
      where: { id: order.id },
      data: ProductionOrderMapper.toUpdateData(order),
    });
    return ProductionOrderMapper.toDomain(row);
  }
}
