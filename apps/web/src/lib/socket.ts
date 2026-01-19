// Simple WebSocket singleton for the toy app.
// In a real app, you might use a Context or a dedicated library like TanStack Query with a socket adapter.

export class SocketClient {
    private static instance: SocketClient;
    private ws: WebSocket | null = null;
    private listeners: Set<(msg: any) => void> = new Set();

    // Quick hack to restore connection/state if the user navigates
    // In a real app, use Context to hold the socket instance.

    private constructor() { }

    static getInstance(): SocketClient {
        if (!SocketClient.instance) {
            SocketClient.instance = new SocketClient();
        }
        return SocketClient.instance;
    }

    private pending: (() => void)[] = [];

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }
        this.ws = new WebSocket('ws://localhost:3001');

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.listeners.forEach(l => l(data));
            } catch (e) {
                console.error('Failed to parse WS message', e);
            }
        };

        this.ws.onopen = () => {
            console.log('WS Connected');
            this.pending.forEach(cb => cb());
            this.pending = [];
        };
        this.ws.onclose = () => console.log('WS Disconnected');
    }

    waitForOpen(): Promise<void> {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            this.pending.push(resolve);
        });
    }

    send(msg: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        } else {
            console.warn('Socket not open, cannot send', msg);
        }
    }

    subscribe(cb: (msg: any) => void) {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }
}

export const socket = SocketClient.getInstance();
