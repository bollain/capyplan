import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { AddressInfo } from 'net';
import { startServer, socketMap } from '../index'; // Import the exposed WS server and state

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
});
