import { Injectable } from '@nestjs/common';
import { OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import * as schema from './schema/index.js';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres/driver';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
    private pool: Pool;

    public db: NodePgDatabase<typeof schema>;

    constructor() {
        const connectionString = process.env.DATABASE_URL;
        this.pool = new Pool({ connectionString });
        this.db = drizzle(this.pool, { schema });

        console.log('DatabaseService initialized with connection string:', connectionString);
    }

    async onModuleDestroy() {
        await this.pool.end();
    }

    get schema() {
        return schema;
    }

}