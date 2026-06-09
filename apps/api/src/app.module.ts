import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MachinesModule } from './modules/machines/machines.module';
import { ProductionOrdersModule } from './modules/production-orders/production-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Single source of truth at the repo root (shared with docker-compose).
      envFilePath: ['../../.env'],
    }),
    MachinesModule,
    ProductionOrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
