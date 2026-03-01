import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SocketClient } from '../socket';

// Mock the global WebSocket
class MockWebSocket {
    send = vi.fn();
    close = vi.fn();
    onopen: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: ((err: Error) => void) | null = null;
    onmessage: ((ev: MessageEvent) => void) | null = null;

    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;

    private _readyState: number = 0;

    get readyState() {
        return this._readyState;
    }

    set readyState(val: number) {
        this._readyState = val;
    }

    // We'll expose instances to tests by pushing them to an array
    static instances: MockWebSocket[] = [];

    constructor() {
        MockWebSocket.instances.push(this);
    }

    static clearInstances() {
        MockWebSocket.instances = [];
    }
}

vi.stubGlobal('WebSocket', MockWebSocket);


describe('SocketClient', () => {
    let client: SocketClient;

    beforeEach(() => {
        vi.useFakeTimers();
        MockWebSocket.clearInstances();
        // Since it's a singleton, we need to ensure it's clean
        client = SocketClient.getInstance();
        client.disconnect();
    });

    afterEach(() => {
        client.disconnect();
        vi.useRealTimers();
    });

    it('connects to the server', () => {
        client.connect();
        expect(MockWebSocket.instances.length).toBe(1);
    });

    it('prevents sending on closed socket', () => {
        client.connect();

        // Grab the mock instance created by connect()
        const mockWs = MockWebSocket.instances[0];

        // Assign readyState natively to the instance
        mockWs.readyState = WebSocket.CLOSED;

        // Try to send
        client.send({ type: 'TEST' });

        expect(mockWs.send).not.toHaveBeenCalled();
    });

    it('reconnects with exponential backoff on close', () => {
        client.connect();
        const mockWs1 = MockWebSocket.instances[0];

        // Simulate close
        if (mockWs1.onclose) mockWs1.onclose();

        // 1st retry: 1s
        vi.advanceTimersByTime(1000);
        expect(MockWebSocket.instances.length).toBe(2);

        const mockWs2 = MockWebSocket.instances[1];
        if (mockWs2.onclose) mockWs2.onclose();

        // 2nd retry: 2s
        vi.advanceTimersByTime(2000);
        expect(MockWebSocket.instances.length).toBe(3);

        const mockWs3 = MockWebSocket.instances[2];
        if (mockWs3.onclose) mockWs3.onclose();

        // 3rd retry: 4s
        vi.advanceTimersByTime(4000);
        expect(MockWebSocket.instances.length).toBe(4);
    });

    it('resends last JOIN_ROOM on open', async () => {
        client.connect();
        const mockWs1 = MockWebSocket.instances[0];

        // Simulate open to get it into ready state temporarily
        mockWs1.readyState = WebSocket.OPEN;

        const joinMsg = { type: 'JOIN_ROOM', roomId: '123' };
        client.send(joinMsg);

        expect(mockWs1.send).toHaveBeenCalledWith(JSON.stringify(joinMsg));

        // Simulate close & reconnect
        if (mockWs1.onclose) mockWs1.onclose();

        // Wait for exponential backoff (1s for first retry)
        vi.runAllTimers();
        await Promise.resolve(); // allow microtask queue to flush

        // After the fake timer advances, the reconnect attempt runs and creates a new MockWebSocket instance
        const mockWs2 = MockWebSocket.instances[1];

        // Ensure new instance is considered OPEN for sending
        mockWs2.readyState = WebSocket.OPEN;

        if (mockWs2.onopen) mockWs2.onopen(); // This should trigger the resend

        expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify(joinMsg));
    });
});
