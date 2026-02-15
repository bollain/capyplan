import { db, rooms } from '../db.js';

async function main() {
    if (!db) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }

    const defaultRooms = [
        { name: 'Vanilla', slug: 'vanilla' },
        { name: '3Dimsum', slug: '3dimsum' },
        { name: 'PurlpleKimchi', slug: 'pk' },
        { name: 'Strawberry', slug: 'strawberry' },
        { name: 'KrimbosRoom', slug: 'krimbosroom' },
    ];

    console.log('Seeding rooms...');

    for (const room of defaultRooms) {
        await db.insert(rooms).values(room).onConflictDoNothing();
    }

    console.log('Seeding complete.');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
