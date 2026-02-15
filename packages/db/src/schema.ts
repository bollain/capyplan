import { pgTable, uuid, text, numeric, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const rooms = pgTable('rooms', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const votingSessions = pgTable('voting_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }),
    finalConsensus: numeric('final_consensus'),
    variance: numeric('variance'),
    participantCount: integer('participant_count'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const votes = pgTable('votes', {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').references(() => votingSessions.id, { onDelete: 'cascade' }),
    userClientId: text('user_client_id').notNull(),
    userName: text('user_name'),
    voteValue: numeric('vote_value').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const roomsRelations = relations(rooms, ({ many }) => ({
    sessions: many(votingSessions),
}));

export const votingSessionsRelations = relations(votingSessions, ({ one, many }) => ({
    room: one(rooms, {
        fields: [votingSessions.roomId],
        references: [rooms.id],
    }),
    votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
    session: one(votingSessions, {
        fields: [votes.sessionId],
        references: [votingSessions.id],
    }),
}));
