import { WebSocketServer, WebSocket } from 'ws';
import {
    ClientMessageSchema,
    ServerMessage,
    RoomState,
    EstimationMode,
    RoomPhase,
    ClientMessage
} from '@capyplan/protocol';
import { calculateEstimate, EstimationResult, calculateExtendedStats } from './logic.js';
import { db, rooms as dbRooms, votingSessions, votes } from './db.js';
import { eq } from 'drizzle-orm';
import { startApiServer } from './api.js';

const wss = new WebSocketServer({ port: 3001 });

// Extended types for server-side state
interface ServerParticipant {
    id: string; // This is the clientId
    name: string;
    isSpectator: boolean;
    connected: boolean;
    lastSeen: number;
    disconnectTimeout?: NodeJS.Timeout;
}

interface ServerRoomState extends Omit<RoomState, 'participants'> {
    participants: ServerParticipant[];
    isPersistent?: boolean;
    dbId?: string; // UUID from DB
}

// In-memory store: RoomID -> ServerRoomState
const rooms = new Map<string, ServerRoomState>();

// Map Socket -> { roomId, userId } for easy cleanup on disconnect
// userId here refers to the stable clientId
interface SocketState {
    roomId?: string;
    userId?: string; // clientId
    ws: WebSocket;
}

const socketMap = new Map<WebSocket, SocketState>();

const GRACE_PERIOD_MS = 60000; // 60 seconds

// Load persistent rooms on startup
(async () => {
    // Start API
    startApiServer();

    if (!db) return;
    try {
        const persistentRooms = await db.select().from(dbRooms);
        console.log(`Loaded ${persistentRooms.length} persistent rooms`);
        for (const pRoom of persistentRooms) {
            rooms.set(pRoom.slug, {
                roomId: pRoom.slug,
                roomName: pRoom.name,
                leaderId: '', // No leader initially
                participants: [],
                phase: RoomPhase.VOTING,
                estimationMode: EstimationMode.PERT,
                availableEstimates: pRoom.defaultDeck || [1, 2, 3, 4, 5, 8], // Use DB deck or default fallback
                isPersistent: true,
                dbId: pRoom.id
            });
        }
    } catch (e) {
        console.error('Failed to load persistent rooms', e);
    }
})();

console.log('Signal server running on ws://localhost:3001');

wss.on('connection', (ws) => {
    socketMap.set(ws, { ws });

    ws.on('message', (data) => {
        try {
            const raw = JSON.parse(data.toString());
            const parseResult = ClientMessageSchema.safeParse(raw);

            if (!parseResult.success) {
                sendError(ws, 'INVALID_ payload', parseResult.error.message);
                return;
            }

            handleMessage(ws, parseResult.data);
        } catch {
            sendError(ws, 'PARSE_ERROR', 'Could not parse message JSON');
        }
    });

    ws.on('close', () => {
        handleSocketClose(ws);
    });
});

function handleMessage(ws: WebSocket, message: ClientMessage) {
    const socketState = socketMap.get(ws);
    if (!socketState) return;

    switch (message.type) {
        case 'JOIN_ROOM': {
            const { roomId, roomName, name, clientId, isSpectator } = message;

            let room = rooms.get(roomId);
            if (!room) {
                // Create new room
                room = {
                    roomId,
                    roomName: roomName, // Store optional roomName
                    leaderId: clientId, // Use clientId as leaderId
                    participants: [],
                    phase: RoomPhase.VOTING,
                    estimationMode: EstimationMode.PERT,
                    availableEstimates: [1, 2, 3, 4, 5, 8], // Default to Vanilla deck
                };
                rooms.set(roomId, room);
            }

            // Check if participant exists (reconnection)
            const existingParticipant = room.participants.find(p => p.id === clientId);

            if (existingParticipant) {
                // Reconnect
                existingParticipant.connected = true;
                existingParticipant.name = name; // Update name just in case
                existingParticipant.lastSeen = Date.now();

                // Cancel pending removal if any
                if (existingParticipant.disconnectTimeout) {
                    clearTimeout(existingParticipant.disconnectTimeout);
                    existingParticipant.disconnectTimeout = undefined;
                }
            } else {
                // New Join
                room.participants.push({
                    id: clientId,
                    name,
                    isSpectator,
                    connected: true,
                    lastSeen: Date.now()
                });
            }

            // Ensure there is a leader (if leader left and came back, or room was empty)
            // If the room had no connected participants (but might have disconnected ones), 
            // valid to ensure leaderId points to someone.
            // If current leader is gone/removed, we might've already reassigned in disconnect logic.
            // But if this is a fresh room, init logic handled it.
            if (room.isPersistent && !room.leaderId) {
                room.leaderId = clientId;
            }

            // Map socket to this clientId
            socketState.roomId = roomId;
            socketState.userId = clientId;

            // Handle duplicate connections: If there was another socket for this clientId, 
            // it will be handled when that socket closes, or we could force close it here.
            // For "last wins", we just update our map. The old socket might send a disconnect event,
            // so we need to be careful not to remove the user if they are actually connected on a new socket.
            // We can prevent the disconnect logic from removing the user by checking connection state.

            broadcastSnapshot(roomId);
            break;
        }
        case 'LEAVE_ROOM':
            handleLeaveRoom(ws);
            break;

        case 'SUBMIT_ESTIMATE': {
            const { payload } = message;
            if (!socketState.roomId) return;
            const room = rooms.get(socketState.roomId);
            if (!room) return;

            const participant = room.participants.find(p => p.id === socketState.userId);
            if (!participant) return;

            if (!room.currentEstimates) {
                room.currentEstimates = {};
            }
            room.currentEstimates[participant.id] = payload;

            console.log(`Stored estimate for ${participant.name} ${JSON.stringify(payload)}`);
            broadcastSnapshot(socketState.roomId);
            break;
        }

        case 'RETRACT_VOTE': {
            if (!socketState.roomId) return;
            const room = rooms.get(socketState.roomId);
            if (!room) return;

            const participant = room.participants.find(p => p.id === socketState.userId);
            if (!participant) return;

            if (room.currentEstimates && room.currentEstimates[participant.id]) {
                delete room.currentEstimates[participant.id];
                console.log(`Retracted estimate for ${participant.name}`);
                broadcastSnapshot(socketState.roomId);
            }
            break;
        }

        case 'REQUEST_REVEAL': {
            if (!socketState.roomId) return;
            const room = rooms.get(socketState.roomId);
            if (!room) return;

            // Prevent duplicate reveals/saves
            if (room.phase === RoomPhase.REVEALED) return;

            console.log(`Reveal requested by ${socketState.userId}`);

            room.phase = RoomPhase.REVEALED;

            // Calculate results
            if (room.currentEstimates) {
                const results: Record<string, EstimationResult> = {};
                for (const [userId, payload] of Object.entries(room.currentEstimates)) {
                    try {
                        results[userId] = calculateEstimate(room.estimationMode, payload);
                    } catch (e) {
                        console.error('Error calculating estimate', e);
                    }
                }
                room.results = results;
            }

            // Save to DB immediately on Reveal
            if (room.results && room.isPersistent && room.dbId && db) {
                const resultsArg = Object.values(room.results) as EstimationResult[];
                const stats = calculateExtendedStats(resultsArg);

                // Async save
                (async () => {
                    try {
                        const deckSnapshot = room.availableEstimates || null;
                        const totalParticipants = room.participants.length;

                        const [session] = await db.insert(votingSessions).values({
                            roomId: room.dbId!,
                            deckSnapshot,
                            participantCount: totalParticipants,
                            voteCount: resultsArg.length,
                            mean: stats.mean.toString(),
                            stddev: stats.stddev.toString(),
                            median: stats.median.toString(),
                            minVote: stats.min.toString(),
                            maxVote: stats.max.toString(),
                            histogram: stats.histogram
                        }).returning();

                        if (session) {
                            const voteEntries = [];
                            for (const [userId, result] of Object.entries(room.results!)) {
                                const participant = room.participants.find(p => p.id === userId);
                                const estimate = room.currentEstimates?.[userId] as object;
                                const typedResult = result as EstimationResult;

                                voteEntries.push({
                                    sessionId: session.id,
                                    userClientId: userId,
                                    userName: participant?.name || 'Unknown',
                                    voteValue: typedResult.score.toString(),
                                    uncertainty: typedResult.stdDev?.toString(),
                                    payload: estimate
                                });
                            }
                            if (voteEntries.length > 0) {
                                await db.insert(votes).values(voteEntries);
                            }
                            console.log(`Saved session ${session.id} for room ${room.roomName}`);
                        }
                    } catch (e) {
                        console.error('Error saving session stats', e);
                    }
                })();
            }

            broadcastSnapshot(socketState.roomId);

            // Broadcast Who Revealed Event
            const revealer = room.participants.find(p => p.id === socketState.userId);
            if (revealer) {
                broadcastEvent(socketState.roomId, 'REVEALED', { userName: revealer.name });
            }
            break;
        }

        case 'REQUEST_NEXT_VOTE': {
            if (!socketState.roomId) return;
            const room = rooms.get(socketState.roomId);
            if (!room) return;

            // Permission check removed: Any participant can request next item

            room.phase = RoomPhase.VOTING;
            room.currentEstimates = undefined;
            room.results = undefined;
            broadcastSnapshot(socketState.roomId);
            break;
        }

        case 'UPDATE_ROOM_SETTINGS': {
            if (!socketState.roomId) return;
            const room = rooms.get(socketState.roomId);
            if (!room) return;

            // Verify sender is leader
            if (room.leaderId !== socketState.userId) {
                sendError(ws, 'FORBIDDEN', 'Only leader can update settings');
                return;
            }

            room.availableEstimates = message.availableEstimates;
            broadcastSnapshot(socketState.roomId);

            // Persist the deck if it's a persistent room
            if (room.isPersistent && room.dbId && db) {
                const dbId = room.dbId; // Capture for closure
                (async () => {
                    try {
                        await db.update(dbRooms)
                            .set({ defaultDeck: message.availableEstimates })
                            .where(eq(dbRooms.id, dbId));
                        console.log(`Updated default deck for persistent room ${dbId}`);
                    } catch (e) {
                        console.error('Failed to update default deck', e);
                    }
                })();
            }

            break;
        }
    }
}

function handleLeaveRoom(ws: WebSocket) {
    const state = socketMap.get(ws);
    if (!state || !state.roomId || !state.userId) return;

    const room = rooms.get(state.roomId);
    if (!room) return;

    const participant = room.participants.find(p => p.id === state.userId);
    if (!participant) return;

    // Check if there are other active sockets for this user in this room
    let hasOtherConnections = false;
    for (const [otherWs, otherState] of socketMap.entries()) {
        if (otherWs !== ws &&
            otherState.roomId === state.roomId &&
            otherState.userId === state.userId &&
            otherWs.readyState === WebSocket.OPEN) {
            hasOtherConnections = true;
            break;
        }
    }

    if (hasOtherConnections) {
        // User is still connected on another tab/device.
        // Do NOT mark as disconnected or start grace period.
        // Just clear this socket's association.
        state.roomId = undefined;
        state.userId = undefined;
        return;
    }

    // Capture values for the closure
    const roomId = state.roomId;
    const userId = state.userId;

    // Logical leave - treat as disconnect for now, or immediate removal?
    // If explicit LEAVE_ROOM, maybe we should remove immediately?
    // Or just mark disconnected? 
    // Usually LEAVE_ROOM means user navigated away.
    // Let's use the same graceful logic for now to allow undo (e.g. accidental nav),
    // OR we can decide LEAVE_ROOM = immediate exit.
    // Given the issues with StrictMode (mount/unmount), graceful is safer for now.

    participant.connected = false;
    participant.lastSeen = Date.now();

    broadcastSnapshot(roomId);

    // Start Grace Period
    if (participant.disconnectTimeout) clearTimeout(participant.disconnectTimeout);

    participant.disconnectTimeout = setTimeout(() => {
        cleanupParticipant(roomId, userId);
    }, GRACE_PERIOD_MS);

    // Clear state on socket so we know it's not "in" the room anymore?
    // If we clear it, RECONNECT (JOIN_ROOM) works fine because it sets it again.
    state.roomId = undefined;
    state.userId = undefined;
}

function handleSocketClose(ws: WebSocket) {
    const state = socketMap.get(ws);
    if (state?.roomId && state?.userId) {
        // Trigger leave logic
        // We need to re-fetch state/logic inside handleLeaveRoom logic essentially,
        // but since we stand to lose the Map entry, we have to run logic first.

        // Reuse logic but ensure we delete map entry at end
        handleLeaveRoom(ws);
    }
    socketMap.delete(ws);
}

function cleanupParticipant(roomId: string, userId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const participant = room.participants.find(p => p.id === userId);
    if (!participant || participant.connected) return; // Reconnected?

    room.participants = room.participants.filter(p => p.id !== userId);

    // Clean up current estimates/results
    if (room.currentEstimates) delete room.currentEstimates[userId];
    if (room.results) delete room.results[userId];

    if (room.participants.length === 0) {
        if (room.isPersistent) {
            // Reset state but keep room
            room.leaderId = '';
            room.currentEstimates = undefined;
            room.results = undefined;
            room.phase = RoomPhase.VOTING;
            console.log(`Persistent room ${roomId} empty, kept in memory.`);
        } else {
            rooms.delete(roomId);
        }
    } else {
        if (room.leaderId === userId) {
            const nextLeader = room.participants.find(p => p.connected) || room.participants[0];
            if (nextLeader) room.leaderId = nextLeader.id;
        }
        broadcastSnapshot(roomId);
    }
}

function broadcastSnapshot(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const msg: ServerMessage = {
        type: 'ROOM_SNAPSHOT',
        state: {
            ...room,
            // Strip server-only fields when sending to client
            participants: room.participants.map(p => ({
                id: p.id,
                name: p.name,
                connected: p.connected,
                isSpectator: p.isSpectator,
            }))
        },
    };

    const payload = JSON.stringify(msg);

    // Inefficient broadcast O(N) over all sockets, good enough for toy app
    for (const [ws, state] of socketMap.entries()) {
        if (state.roomId === roomId && ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    }
}

function sendError(ws: WebSocket, code: string, message: string) {
    const msg: ServerMessage = { type: 'ERROR', code, message };
    ws.send(JSON.stringify(msg));
}

function broadcastEvent(roomId: string, event: 'REVEALED', payload: { userName: string }) {
    const msg: ServerMessage = {
        type: 'ROOM_EVENT',
        event,
        payload
    };
    const data = JSON.stringify(msg);

    for (const [ws, state] of socketMap.entries()) {
        if (state.roomId === roomId && ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    }
}
