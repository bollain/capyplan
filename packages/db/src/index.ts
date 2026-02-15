export * from './schema.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export const createDbClient = (connectionString: string) => {
    const client = postgres(connectionString);
    return drizzle(client, { schema });
};
