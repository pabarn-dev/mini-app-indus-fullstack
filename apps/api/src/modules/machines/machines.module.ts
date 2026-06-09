import { Module } from '@nestjs/common';
import { SystemClock } from '../../infrastructure/clock/system.clock';
import { UuidV7Generator } from '../../infrastructure/id/uuid-v7.generator';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { CLOCK, Clock } from './application/ports/clock';
import { ID_GENERATOR, IdGenerator } from './application/ports/id-generator';
import { MACHINE_REPOSITORY, MachineRepository } from './application/ports/machine.repository';
import { CreateMachineUseCase } from './application/use-cases/create-machine.use-case';
import { GetMachineByIdUseCase } from './application/use-cases/get-machine-by-id.use-case';
import { ListMachinesUseCase } from './application/use-cases/list-machines.use-case';
import { UpdateMachineStatusUseCase } from './application/use-cases/update-machine-status.use-case';
import { PrismaMachineRepository } from './infrastructure/prisma/prisma-machine.repository';
import { MachinesController } from './presentation/controllers/machines.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MachinesController],
  providers: [
    // Ports → infrastructure adapters.
    { provide: MACHINE_REPOSITORY, useClass: PrismaMachineRepository },
    { provide: ID_GENERATOR, useClass: UuidV7Generator },
    { provide: CLOCK, useClass: SystemClock },
    // Use cases stay framework-free → instantiated via factories.
    {
      provide: CreateMachineUseCase,
      useFactory: (machines: MachineRepository, idGenerator: IdGenerator, clock: Clock) =>
        new CreateMachineUseCase(machines, idGenerator, clock),
      inject: [MACHINE_REPOSITORY, ID_GENERATOR, CLOCK],
    },
    {
      provide: ListMachinesUseCase,
      useFactory: (machines: MachineRepository) => new ListMachinesUseCase(machines),
      inject: [MACHINE_REPOSITORY],
    },
    {
      provide: GetMachineByIdUseCase,
      useFactory: (machines: MachineRepository) => new GetMachineByIdUseCase(machines),
      inject: [MACHINE_REPOSITORY],
    },
    {
      provide: UpdateMachineStatusUseCase,
      useFactory: (machines: MachineRepository) => new UpdateMachineStatusUseCase(machines),
      inject: [MACHINE_REPOSITORY],
    },
  ],
})
export class MachinesModule {}
