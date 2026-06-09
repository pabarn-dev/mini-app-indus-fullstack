import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';

// The single place that instantiates the Prisma 7 client (with the pg driver
// adapter). Reads DATABASE_URL from the environment (loaded by ConfigModule in
// the running app). No Nest-injected dependencies → trivially instantiable in tests.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly transactionContext = new AsyncLocalStorage<Prisma.TransactionClient>();
  // The usable (proxy) client, captured at construction. Prisma's client is a
  // Proxy whose model delegates are not reachable from `this` inside a getter.
  private readonly baseClient: Prisma.TransactionClient;

  constructor() {
    const connectionString = process.env['DATABASE_URL'];
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set — copy .env.example to .env first.');
    }
    super({ adapter: new PrismaPg({ connectionString }) });
    this.baseClient = this;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  // The active client: the current transaction client when inside
  // `runInTransaction`, otherwise the base client.
  get db(): Prisma.TransactionClient {
    return this.transactionContext.getStore() ?? this.baseClient;
  }

  // Runs `work` inside a single interactive transaction. Any query issued via
  // `db` during `work` participates in that transaction (atomic commit/rollback).
  runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.$transaction((tx) => this.transactionContext.run(tx, work));
  }
}
