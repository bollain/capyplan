import Fastify from 'fastify';
import cors from '@fastify/cors';
import { db, rooms, votingSessions } from './db.js';
import { eq, desc } from 'drizzle-orm';

export const fastify = Fastify({ logger: true });

fastify.register(cors, {
    origin: '*' // Allow all origins for now (dev/web)
});

fastify.get('/api/rooms/:slug/stats', async (request, reply) => {
    if (!db) {
        return reply.status(500).send({ error: 'Database not connected' });
    }
    const { slug } = request.params as { slug: string };

    try {
        // Use query builder to fetch room with sessions
        const roomData = await db.query.rooms.findFirst({
            where: eq(rooms.slug, slug),
            with: {
                sessions: {
                    orderBy: desc(votingSessions.createdAt),
                    limit: 50 // Limit to last 50 sessions for performance
                }
            }
        });

        if (!roomData) {
            return reply.status(404).send({ error: 'Room not found' });
        }

        // Process Data for Frontend
        const consensusHistory = roomData.sessions.map(s => ({
            date: s.createdAt,
            consensus: parseFloat(s.mean || '0'),
            variance: parseFloat(s.stddev || '0')
        })).reverse();

        const voteDist: Record<string, number> = {};
        let totalVotes = 0;

        roomData.sessions.forEach(s => {
            totalVotes += s.voteCount;
            if (s.histogram) {
                const hist = s.histogram as Record<string, number>;
                for (const [val, count] of Object.entries(hist)) {
                    voteDist[val] = (voteDist[val] || 0) + count;
                }
            }
        });

        const participation = roomData.sessions.map(s => ({
            date: s.createdAt,
            count: s.participantCount
        })).reverse();

        return {
            roomName: roomData.name,
            consensusHistory,
            voteDistribution: voteDist,
            participation,
            totalSessions: roomData.sessions.length,
            totalVotes
        };
    } catch (e) {
        request.log.error(e);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
});

export async function startApiServer() {
    try {
        // Run on port 3002 to facilitate separate dev proxying if needed, or just direct calls.
        // In prod, this would likely be same port as WS via integration, but separate is fine for now.
        const port = 3002;
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`API Server running on http://localhost:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
