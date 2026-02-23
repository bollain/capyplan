import { db } from '../db.js';
import { sql } from 'drizzle-orm';

async function main() {
    if (!db) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }

    console.log('🗑️  Dropping all tables...');

    try {
        // Drop tables in correct order (dependency reverse) or use CASCADE
        await db.execute(sql`DROP TABLE IF EXISTS votes, voting_sessions, rooms CASCADE;`);

        console.log('✅ Tables dropped.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error dropping tables:', err);
        process.exit(1);
    }
}

main();
