import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Non-global: feature modules import it explicitly (e.g. MachinesModule in 3E).
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
