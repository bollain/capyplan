import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import path from 'path';

// Use process.cwd() which is robust when running scripts from package root
const envPath = path.resolve(process.cwd(), '../../.env');
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Please ensure you have configured it in your environment variables.");
    process.exit(1);
}

export default {
    schema: './src/schema.ts',
    out: './drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL,
    },
} satisfies Config;
