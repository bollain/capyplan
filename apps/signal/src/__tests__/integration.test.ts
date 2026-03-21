import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { AddressInfo } from 'net';
import { ServerMessage } from '@capyplan/protocol';
import { startServer, socketMap } from '../index'; // Import the exposed WS server and state

type RoomSnapshotMessage = Extract<ServerMessage, { type: 'ROOM_SNAPSHOT' }>;

// We need to test the websocket map cleanup logic

describe('Signal Server Integration', () => {
    let serverUrl: string;
    let testServer: import('ws').WebSocketServer | null = null;

    beforeAll(async () => {
        // Start the signal server on a random port for testing
        testServer = startServer(0);

        await new Promise<void>((resolve) => {
            testServer?.on('listening', () => {
                const port = (testServer?.address() as AddressInfo).port;
                serverUrl = `ws://localhost:${port}`;
                resolve();
            });
        });
    });

    afterAll(() => {
        if (testServer) {
            testServer.close();
        }
    });

    it('cleans up sockets on disconnect without memory leaks', async () => {
        // Connect and disconnect 100 times to see if it survives
        for (let i = 0; i < 100; i++) {
            const ws = new WebSocket(serverUrl);
            await new Promise(resolve => ws.on('open', resolve));
            ws.close();
            await new Promise(resolve => ws.on('close', resolve));
        }
        // Wait a tiny bit for the server to process the final disconnect event
        await new Promise(resolve => setTimeout(resolve, 50));

        // Assert socketMap size is 0
        expect(socketMap.size).toBe(0);
    });

    it('resets room state on UPDATE_ROOM_SETTINGS', async () => {
        const ws = new WebSocket(serverUrl);
        await new Promise(resolve => ws.on('open', resolve));
        const uniqueRoom = `test-settings-${Date.now()}`;

        // 1. Join room
        ws.send(JSON.stringify({
            type: 'JOIN_ROOM',
            roomId: uniqueRoom,
            name: 'Leader',
            clientId: 'leader-123',
            isSpectator: false,
            estimationMode: 'PERT'
        }));

        // Wait for first snapshot
        await new Promise(resolve => ws.once('message', resolve));

        // 2. Submit estimate
        ws.send(JSON.stringify({
            type: 'SUBMIT_ESTIMATE',
            itemId: 'task-1',
            estimationMode: 'PERT',
            payload: { optimistic: 1, mostLikely: 2, pessimistic: 3 }
        }));

        // Wait for snapshot with vote
        const snapshotWithVote = await new Promise<RoomSnapshotMessage>(resolve => {
            ws.once('message', (data) => resolve(JSON.parse(data.toString())));
        });
        expect(snapshotWithVote.state.currentEstimates?.['leader-123']).toBeDefined();

        // 3. Update settings
        ws.send(JSON.stringify({
            type: 'UPDATE_ROOM_SETTINGS',
            availableEstimates: [1, 2, 3],
            estimationMode: 'POKER'
        }));

        // Wait for final snapshot with cleared state
        const finalSnapshot = await new Promise<RoomSnapshotMessage>(resolve => {
            ws.once('message', (data) => resolve(JSON.parse(data.toString())));
        });

        expect(finalSnapshot.state.phase).toBe('VOTING');
        expect(finalSnapshot.state.currentEstimates).toBeUndefined();
        expect(finalSnapshot.state.results).toBeUndefined();

        ws.close();
    });

    it('updates participant details on UPDATE_PARTICIPANT', async () => {
        const ws = new WebSocket(serverUrl);
        await new Promise(resolve => ws.on('open', resolve));
        const uniqueRoom = `test-participant-${Date.now()}`;

        // 1. Join room
        ws.send(JSON.stringify({
            type: 'JOIN_ROOM',
            roomId: uniqueRoom,
            name: 'OldName',
            emoji: '🐹',
            clientId: 'user-123',
            isSpectator: false,
            estimationMode: 'PERT'
        }));

        // Wait for first snapshot
        let snapshot = await new Promise<RoomSnapshotMessage>(resolve => {
            ws.once('message', (data) => resolve(JSON.parse(data.toString())));
        });
        
        let me = snapshot.state.participants.find(p => p.id === 'user-123');
        expect(me?.name).toBe('OldName');
        expect(me?.emoji).toBe('🐹');
        expect(me?.isSpectator).toBe(false);

        // 2. Update participant
        ws.send(JSON.stringify({
            type: 'UPDATE_PARTICIPANT',
            name: 'NewName',
            emoji: '😎',
            isSpectator: true
        }));

        // Wait for updated snapshot
        snapshot = await new Promise<RoomSnapshotMessage>(resolve => {
            ws.once('message', (data) => resolve(JSON.parse(data.toString())));
        });

        me = snapshot.state.participants.find(p => p.id === 'user-123');
        expect(me?.name).toBe('NewName');
        expect(me?.emoji).toBe('😎');
        expect(me?.isSpectator).toBe(true);
        
        ws.close();
    });
});

