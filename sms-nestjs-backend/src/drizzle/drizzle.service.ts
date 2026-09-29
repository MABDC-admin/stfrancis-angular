import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as relations from './relations';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  public db: NodePgDatabase<typeof schema & typeof relations>;
  private pool!: Pool;

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is missing in environment variables');
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: this.shouldUseSsl(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
    });

    await this.pool.connect().then((client) => client.release());
    this.db = drizzle(this.pool, { schema: { ...schema, ...relations } });
    console.log('Drizzle ORM initialized with node-postgres driver');
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  private shouldUseSsl(databaseUrl: string) {
    const lowered = databaseUrl.toLowerCase();
    return lowered.includes('sslmode=require') || lowered.includes('ssl=true');
  }
}
