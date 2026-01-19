import { WebSocketServer, WebSocket } from 'ws';
import {
    ClientMessageSchema,
    ServerMessage,
    RoomState,
    EstimationMode,
    RoomPhase,
    JoinRoomSchema,
    ClientMessage
} from '@capyplan/protocol';
import { z } from 'zod';
import { calculateEstimate } from './logic';

const wss = new WebSocketServer({ port: 3001 });

// In-memory store: RoomID -> RoomState
const rooms = new Map<string, RoomState>();

// Map Socket -> { roomId, userId } for easy cleanup on disconnect
interface SocketState {
    roomId?: string;
    userId?: string;
    ws: WebSocket;
}

const socketMap = new Map<WebSocket, SocketState>();

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
        } catch (e) {
            sendError(ws, 'PARSE_ERROR', 'Could not parse message JSON');
        }
    });

    ws.on('close', () => {
        handleDisconnect(ws);
    });
});

function handleMessage(ws: WebSocket, message: ClientMessage) {
    const socketState = socketMap.get(ws);
    if (!socketState) return;

    switch (message.type) {
        case 'JOIN_ROOM': {
            const { roomId, name } = message;

            let room = rooms.get(roomId);
            if (!room) {
                // Create new room
                room = {
                    roomId,
                    leaderId: name, // Simplification: assume name is ID for first user, or generate UUID
                    participants: [],
                    phase: RoomPhase.IDLE,
                    estimationMode: EstimationMode.PERTYBARA,
                };
                rooms.set(roomId, room);
            }

            // Generate a random ID for the user if we were building for real, 
            // but for now simpler to just use a random string or let client send it.
            // The protocol says client sends name. Let's make an ID.
            const userId = Math.random().toString(36).substring(7);

            // If room is new, make this user leader
            if (room.participants.length === 0) {
                room.leaderId = userId;
            }

            room.participants.push({ id: userId, name });
            socketState.roomId = roomId;
            socketState.userId = userId;

            broadcastSnapshot(roomId);
            break;
        }
        case 'LEAVE_ROOM':
            handleDisconnect(ws);
            break;

        case 'SUBMIT_ESTIMATE': {
            const { itemId, payload } = message;
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

        case 'REQUEST_REVEAL': {
            if (!socketState.roomId) return;
            const room = rooms.get(socketState.roomId);
            if (!room) return;
            console.log(`Reveal requested by ${socketState.userId}`);
            console.log(`Leader is ${room.leaderId}`);
            console.log(`Current phase is ${room.phase}`);

            //Verify sender is leader
            if (room.leaderId !== socketState.userId) {
                sendError(ws, 'FORBIDDEN', 'Only leader can reveal');
                return;
            }

            room.phase = RoomPhase.REVEALED;

            // Calculate results
            if (room.currentEstimates) {
                const results: Record<string, any> = {};
                for (const [userId, payload] of Object.entries(room.currentEstimates)) {
                    try {
                        results[userId] = calculateEstimate(room.estimationMode, payload);
                    } catch (e) {
                        console.error('Error calculating estimate', e);
                    }
                }
                room.results = results;
            }

            broadcastSnapshot(socketState.roomId);
            break;
        }

        case 'REQUEST_NEXT_ITEM':
            if (!socketState.roomId) return;
            const room = rooms.get(socketState.roomId);
            if (!room) return;
            //Verify sender is leader
            if (room.leaderId !== socketState.userId) {
                sendError(ws, 'FORBIDDEN', 'Only leader can request next item');
                return;
            }
            room.phase = RoomPhase.IDLE;
            room.currentEstimates = undefined;
            room.results = undefined;
            broadcastSnapshot(socketState.roomId);
            break;

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
            break;
        }
    }
}

function handleDisconnect(ws: WebSocket) {
    const state = socketMap.get(ws);
    if (!state || !state.roomId || !state.userId) return;

    const room = rooms.get(state.roomId);
    if (room) {
        room.participants = room.participants.filter(p => p.id !== state.userId);
        if (room.participants.length === 0) {
            rooms.delete(state.roomId);
        } else {
            // Did the leader leave?
            if (room.leaderId === state.userId) {
                // Assign new leader
                room.leaderId = room.participants[0].id;
            }
            broadcastSnapshot(state.roomId);
        }
    }

    state.roomId = undefined;
    state.userId = undefined;
}

function broadcastSnapshot(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const msg: ServerMessage = {
        type: 'ROOM_SNAPSHOT',
        state: room,
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
