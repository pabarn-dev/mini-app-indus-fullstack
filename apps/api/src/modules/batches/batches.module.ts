import { Module } from '@nestjs/common';
import { SystemClock } from '../../infrastructure/clock/system.clock';
import { UuidV7Generator } from '../../infrastructure/id/uuid-v7.generator';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PrismaAuditLogWriter } from '../../infrastructure/prisma/prisma-audit-log-writer';
import { PrismaTransactionRunner } from '../../infrastructure/prisma/prisma-transaction-runner';
import { AUDIT_LOG_WRITER, AuditLogWriter } from '../../shared/application/ports/audit-log-writer';
import { CLOCK, Clock } from '../../shared/application/ports/clock';
import { ID_GENERATOR, IdGenerator } from '../../shared/application/ports/id-generator';
import {
  TRANSACTION_RUNNER,
  TransactionRunner,
} from '../../shared/application/ports/transaction-runner';
import {
  PRODUCTION_ORDER_REPOSITORY,
  ProductionOrderRepository,
} from '../production-orders/application/ports/production-order.repository';
import { ProductionOrdersModule } from '../production-orders/production-orders.module';
import { BATCH_REPOSITORY, BatchRepository } from './application/ports/batch.repository';
import {
  PRODUCTION_ORDER_GATEWAY,
  ProductionOrderGateway,
} from './application/ports/production-order-gateway';
import {
  QUALITY_CHECK_REPOSITORY,
  QualityCheckRepository,
} from './application/ports/quality-check.repository';
import { AddQualityCheckUseCase } from './application/use-cases/add-quality-check.use-case';
import { CompleteBatchUseCase } from './application/use-cases/complete-batch.use-case';
import { CreateBatchUseCase } from './application/use-cases/create-batch.use-case';
import { GetBatchByIdUseCase } from './application/use-cases/get-batch-by-id.use-case';
import { ListBatchesUseCase } from './application/use-cases/list-batches.use-case';
import { ListQualityChecksUseCase } from './application/use-cases/list-quality-checks.use-case';
import { RecordBatchQuantityUseCase } from './application/use-cases/record-batch-quantity.use-case';
import { PrismaBatchRepository } from './infrastructure/prisma/prisma-batch.repository';
import { PrismaQualityCheckRepository } from './infrastructure/prisma/prisma-quality-check.repository';
import { ProductionOrderGatewayAdapter } from './infrastructure/prisma/production-order-gateway.adapter';
import { BatchesController } from './presentation/controllers/batches.controller';

@Module({
  imports: [PrismaModule, ProductionOrdersModule],
  controllers: [BatchesController],
  providers: [
    // Ports → infrastructure adapters.
    { provide: BATCH_REPOSITORY, useClass: PrismaBatchRepository },
    { provide: QUALITY_CHECK_REPOSITORY, useClass: PrismaQualityCheckRepository },
    { provide: AUDIT_LOG_WRITER, useClass: PrismaAuditLogWriter },
    { provide: TRANSACTION_RUNNER, useClass: PrismaTransactionRunner },
    { provide: ID_GENERATOR, useClass: UuidV7Generator },
    { provide: CLOCK, useClass: SystemClock },
    {
      provide: PRODUCTION_ORDER_GATEWAY,
      useFactory: (orders: ProductionOrderRepository) => new ProductionOrderGatewayAdapter(orders),
      inject: [PRODUCTION_ORDER_REPOSITORY],
    },
    // Use cases stay framework-free → instantiated via factories.
    {
      provide: CreateBatchUseCase,
      useFactory: (
        batches: BatchRepository,
        orders: ProductionOrderGateway,
        idGenerator: IdGenerator,
        clock: Clock,
      ) => new CreateBatchUseCase(batches, orders, idGenerator, clock),
      inject: [BATCH_REPOSITORY, PRODUCTION_ORDER_GATEWAY, ID_GENERATOR, CLOCK],
    },
    {
      provide: RecordBatchQuantityUseCase,
      useFactory: (batches: BatchRepository) => new RecordBatchQuantityUseCase(batches),
      inject: [BATCH_REPOSITORY],
    },
    {
      provide: CompleteBatchUseCase,
      useFactory: (
        batches: BatchRepository,
        audit: AuditLogWriter,
        clock: Clock,
        transactions: TransactionRunner,
      ) => new CompleteBatchUseCase(batches, audit, clock, transactions),
      inject: [BATCH_REPOSITORY, AUDIT_LOG_WRITER, CLOCK, TRANSACTION_RUNNER],
    },
    {
      provide: AddQualityCheckUseCase,
      useFactory: (
        batches: BatchRepository,
        checks: QualityCheckRepository,
        audit: AuditLogWriter,
        idGenerator: IdGenerator,
        clock: Clock,
        transactions: TransactionRunner,
      ) => new AddQualityCheckUseCase(batches, checks, audit, idGenerator, clock, transactions),
      inject: [
        BATCH_REPOSITORY,
        QUALITY_CHECK_REPOSITORY,
        AUDIT_LOG_WRITER,
        ID_GENERATOR,
        CLOCK,
        TRANSACTION_RUNNER,
      ],
    },
    {
      provide: ListBatchesUseCase,
      useFactory: (batches: BatchRepository) => new ListBatchesUseCase(batches),
      inject: [BATCH_REPOSITORY],
    },
    {
      provide: GetBatchByIdUseCase,
      useFactory: (batches: BatchRepository) => new GetBatchByIdUseCase(batches),
      inject: [BATCH_REPOSITORY],
    },
    {
      provide: ListQualityChecksUseCase,
      useFactory: (checks: QualityCheckRepository) => new ListQualityChecksUseCase(checks),
      inject: [QUALITY_CHECK_REPOSITORY],
    },
  ],
})
export class BatchesModule {}
