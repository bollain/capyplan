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

    private pending: { resolve: () => void; reject: (err: Error) => void }[] = [];

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = '3001';
        this.ws = new WebSocket(`${protocol}//${host}:${port}`);

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
            this.pending.forEach(cb => cb.resolve());
            this.pending = [];
        };

        this.ws.onclose = () => console.log('WS Disconnected');

        this.ws.onerror = (err) => {
            console.error('WS Error', err);
            this.pending.forEach(cb => cb.reject(new Error('WebSocket Connection Failed')));
            this.pending = [];
        };
    }

    waitForOpen(timeoutMs = 5000): Promise<void> {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }
        // If socket failed or closed, reject immediately
        if (this.ws && (this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING)) {
            return Promise.reject(new Error('Socket is closed'));
        }

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                const idx = this.pending.findIndex(p => p.resolve === resolve);
                if (idx !== -1) {
                    this.pending.splice(idx, 1);
                    reject(new Error('Connection Timeout'));
                }
            }, timeoutMs);

            this.pending.push({
                resolve: () => { clearTimeout(timer); resolve(); },
                reject: (err) => { clearTimeout(timer); reject(err); }
            });
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
