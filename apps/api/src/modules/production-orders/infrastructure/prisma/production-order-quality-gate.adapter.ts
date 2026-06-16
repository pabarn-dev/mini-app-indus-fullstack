import { Injectable } from '@nestjs/common';
import { QualityCheckResult as PrismaQualityCheckResult } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ProductionOrderQualityGate } from '../../application/ports/production-order-quality-gate';

// Reads Batch / QualityCheck rows via Prisma to answer the quality gate, without
// importing the Batches module — Production Orders stays decoupled from Batches.
@Injectable()
export class PrismaProductionOrderQualityGate implements ProductionOrderQualityGate {
  constructor(private readonly prisma: PrismaService) {}

  async hasFailedQualityCheck(productionOrderId: string): Promise<boolean> {
    const count = await this.prisma.db.qualityCheck.count({
      where: { result: PrismaQualityCheckResult.FAILED, batch: { productionOrderId } },
    });
    return count > 0;
  }
}
