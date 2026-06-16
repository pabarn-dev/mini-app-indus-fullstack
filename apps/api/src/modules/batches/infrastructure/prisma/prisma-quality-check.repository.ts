import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { QualityCheckRepository } from '../../application/ports/quality-check.repository';
import { QualityCheck } from '../../domain/entities/quality-check';
import { QualityCheckMapper } from './quality-check.mapper';

@Injectable()
export class PrismaQualityCheckRepository implements QualityCheckRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(check: QualityCheck): Promise<QualityCheck> {
    const row = await this.prisma.db.qualityCheck.create({
      data: QualityCheckMapper.toCreateData(check),
    });
    return QualityCheckMapper.toDomain(row);
  }

  async findByBatchId(batchId: string): Promise<QualityCheck[]> {
    const rows = await this.prisma.db.qualityCheck.findMany({
      where: { batchId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => QualityCheckMapper.toDomain(row));
  }
}
