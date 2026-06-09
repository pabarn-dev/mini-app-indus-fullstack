import { Module } from '@nestjs/common';
import { SystemClock } from '../../infrastructure/clock/system.clock';
import { UuidV7Generator } from '../../infrastructure/id/uuid-v7.generator';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PrismaTransactionRunner } from '../../infrastructure/prisma/prisma-transaction-runner';
import { CLOCK, Clock } from '../../shared/application/ports/clock';
import { ID_GENERATOR, IdGenerator } from '../../shared/application/ports/id-generator';
import {
  TRANSACTION_RUNNER,
  TransactionRunner,
} from '../../shared/application/ports/transaction-runner';
import {
  MACHINE_REPOSITORY,
  MachineRepository,
} from '../machines/application/ports/machine.repository';
import { MachinesModule } from '../machines/machines.module';
import { AUDIT_LOG_WRITER, AuditLogWriter } from './application/ports/audit-log-writer';
import { MACHINE_GATEWAY, MachineGateway } from './application/ports/machine-gateway';
import {
  PRODUCTION_ORDER_REPOSITORY,
  ProductionOrderRepository,
} from './application/ports/production-order.repository';
import { CancelProductionOrderUseCase } from './application/use-cases/cancel-production-order.use-case';
import { CompleteProductionOrderUseCase } from './application/use-cases/complete-production-order.use-case';
import { CreateProductionOrderUseCase } from './application/use-cases/create-production-order.use-case';
import { GetProductionOrderByIdUseCase } from './application/use-cases/get-production-order-by-id.use-case';
import { ListProductionOrdersUseCase } from './application/use-cases/list-production-orders.use-case';
import { PlanProductionOrderUseCase } from './application/use-cases/plan-production-order.use-case';
import { StartProductionOrderUseCase } from './application/use-cases/start-production-order.use-case';
import { MachineGatewayAdapter } from './infrastructure/prisma/machine-gateway.adapter';
import { PrismaAuditLogWriter } from './infrastructure/prisma/prisma-audit-log-writer';
import { PrismaProductionOrderRepository } from './infrastructure/prisma/prisma-production-order.repository';
import { ProductionOrdersController } from './presentation/controllers/production-orders.controller';

@Module({
  imports: [PrismaModule, MachinesModule],
  controllers: [ProductionOrdersController],
  providers: [
    // Ports → infrastructure adapters.
    { provide: PRODUCTION_ORDER_REPOSITORY, useClass: PrismaProductionOrderRepository },
    { provide: AUDIT_LOG_WRITER, useClass: PrismaAuditLogWriter },
    { provide: TRANSACTION_RUNNER, useClass: PrismaTransactionRunner },
    { provide: ID_GENERATOR, useClass: UuidV7Generator },
    { provide: CLOCK, useClass: SystemClock },
    {
      provide: MACHINE_GATEWAY,
      useFactory: (machines: MachineRepository) => new MachineGatewayAdapter(machines),
      inject: [MACHINE_REPOSITORY],
    },
    // Use cases stay framework-free → instantiated via factories.
    {
      provide: CreateProductionOrderUseCase,
      useFactory: (
        orders: ProductionOrderRepository,
        machines: MachineGateway,
        idGenerator: IdGenerator,
        clock: Clock,
      ) => new CreateProductionOrderUseCase(orders, machines, idGenerator, clock),
      inject: [PRODUCTION_ORDER_REPOSITORY, MACHINE_GATEWAY, ID_GENERATOR, CLOCK],
    },
    {
      provide: ListProductionOrdersUseCase,
      useFactory: (orders: ProductionOrderRepository) => new ListProductionOrdersUseCase(orders),
      inject: [PRODUCTION_ORDER_REPOSITORY],
    },
    {
      provide: GetProductionOrderByIdUseCase,
      useFactory: (orders: ProductionOrderRepository) => new GetProductionOrderByIdUseCase(orders),
      inject: [PRODUCTION_ORDER_REPOSITORY],
    },
    {
      provide: PlanProductionOrderUseCase,
      useFactory: (
        orders: ProductionOrderRepository,
        audit: AuditLogWriter,
        clock: Clock,
        transactions: TransactionRunner,
      ) => new PlanProductionOrderUseCase(orders, audit, clock, transactions),
      inject: [PRODUCTION_ORDER_REPOSITORY, AUDIT_LOG_WRITER, CLOCK, TRANSACTION_RUNNER],
    },
    {
      provide: StartProductionOrderUseCase,
      useFactory: (
        orders: ProductionOrderRepository,
        machines: MachineGateway,
        audit: AuditLogWriter,
        clock: Clock,
        transactions: TransactionRunner,
      ) => new StartProductionOrderUseCase(orders, machines, audit, clock, transactions),
      inject: [
        PRODUCTION_ORDER_REPOSITORY,
        MACHINE_GATEWAY,
        AUDIT_LOG_WRITER,
        CLOCK,
        TRANSACTION_RUNNER,
      ],
    },
    {
      provide: CompleteProductionOrderUseCase,
      useFactory: (
        orders: ProductionOrderRepository,
        audit: AuditLogWriter,
        clock: Clock,
        transactions: TransactionRunner,
      ) => new CompleteProductionOrderUseCase(orders, audit, clock, transactions),
      inject: [PRODUCTION_ORDER_REPOSITORY, AUDIT_LOG_WRITER, CLOCK, TRANSACTION_RUNNER],
    },
    {
      provide: CancelProductionOrderUseCase,
      useFactory: (
        orders: ProductionOrderRepository,
        audit: AuditLogWriter,
        transactions: TransactionRunner,
      ) => new CancelProductionOrderUseCase(orders, audit, transactions),
      inject: [PRODUCTION_ORDER_REPOSITORY, AUDIT_LOG_WRITER, TRANSACTION_RUNNER],
    },
  ],
})
export class ProductionOrdersModule {}
