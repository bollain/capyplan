import { createDbClient } from '@capyplan/db';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from monorepo root (3 levels up from src/db.js)
// We use path.resolve to be robust regardless of CWD (e.g. monorepo root vs package root)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn('DATABASE_URL not set. Persistence disabled.');
}

export const db = connectionString ? createDbClient(connectionString) : null;

export * from '@capyplan/db';
