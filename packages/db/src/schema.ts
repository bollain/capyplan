import { pgTable, uuid, text, numeric, timestamp, integer, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Seeded rooms only. Ephemeral rooms are not stored.
export const rooms = pgTable('rooms', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    defaultDeck: jsonb('default_deck').$type<number[]>(), // The preferred deck for persistent rooms
    createdAt: timestamp('created_at').defaultNow(),
});

// One row per revealed session. Stores snapshots to avoid expensive aggregation queries.
export const votingSessions = pgTable('voting_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),

    // Context
    deckSnapshot: jsonb('deck_snapshot').$type<number[]>(), // Preserves the deck used
    participantCount: integer('participant_count').notNull(),
    voteCount: integer('vote_count').notNull(),

    // Pre-calculated Stats
    mean: numeric('mean'),
    stddev: numeric('stddev'),
    median: numeric('median'),
    minVote: numeric('min_vote'),
    maxVote: numeric('max_vote'),
    histogram: jsonb('histogram').$type<Record<string, number>>(), // { "1": 3, "5": 1 }

    createdAt: timestamp('created_at').defaultNow(), // functions as "revealedAt"
}, (t) => ({
    roomCreatedIdx: index('idx_sessions_room_created').on(t.roomId, t.createdAt),
}));

// Optional deep analytics. Written only on reveal.
export const votes = pgTable('votes', {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').notNull().references(() => votingSessions.id, { onDelete: 'cascade' }),

    userClientId: text('user_client_id').notNull(),
    userName: text('user_name'), // Snapshot of name
    voteValue: numeric('vote_value').notNull(),
    uncertainty: numeric('uncertainty'), // Standard Deviation (PERT)
    payload: jsonb('payload'), // Raw input (Optimistic, Pessimistic, etc)

    createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
    sessionIdx: index('idx_votes_session').on(t.sessionId),
    uniqueVote: uniqueIndex('idx_votes_unique_user_session').on(t.sessionId, t.userClientId),
}));

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
