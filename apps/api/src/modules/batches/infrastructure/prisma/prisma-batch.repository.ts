import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { DuplicateBatchSequenceError } from '../../application/errors/duplicate-batch-sequence.error';
import { BatchRepository } from '../../application/ports/batch.repository';
import { Batch } from '../../domain/entities/batch';
import { BatchMapper } from './batch.mapper';

@Injectable()
export class PrismaBatchRepository implements BatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(batch: Batch): Promise<Batch> {
    try {
      const row = await this.prisma.db.batch.create({
        data: BatchMapper.toCreateData(batch),
      });
      return BatchMapper.toDomain(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Violation of @@unique([productionOrderId, sequence]) — typically under concurrency.
        throw DuplicateBatchSequenceError.forSequence(batch.productionOrderId, batch.sequence);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Batch | null> {
    const row = await this.prisma.db.batch.findUnique({ where: { id } });
    return row === null ? null : BatchMapper.toDomain(row);
  }

  async findByProductionOrderId(productionOrderId: string): Promise<Batch[]> {
    const rows = await this.prisma.db.batch.findMany({
      where: { productionOrderId },
      orderBy: { sequence: 'asc' },
    });
    return rows.map((row) => BatchMapper.toDomain(row));
  }

  async update(batch: Batch): Promise<Batch> {
    const row = await this.prisma.db.batch.update({
      where: { id: batch.id },
      data: BatchMapper.toUpdateData(batch),
    });
    return BatchMapper.toDomain(row);
  }
}
