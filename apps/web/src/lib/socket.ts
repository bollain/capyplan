// Simple WebSocket singleton for the toy app.
// In a real app, you might use a Context or a dedicated library like TanStack Query with a socket adapter.

export class SocketClient {
    private static instance: SocketClient;
    private ws: WebSocket | null = null;
    private listeners: Set<(msg: unknown) => void> = new Set();
    private reconnectTimeout: number | null = null;
    private reconnectAttempts = 0;
    private lastJoinParams: unknown = null;

    // Quick hack to restore connection/state if the user navigates
    // In a real app, use Context to hold the socket instance.

    private constructor() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.connect();
            }
        });

        window.addEventListener('online', () => {
            this.connect();
        });
    }

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

        if (this.ws && (this.ws.readyState === WebSocket.CLOSING || this.ws.readyState === WebSocket.CLOSED)) {
            try { this.ws.close(); } catch { /* ignore */ }
            this.ws = null;
        }

        // Production override or Local fallback
        const envUrl = import.meta.env.VITE_SIGNAL_URL;

        let url;
        if (envUrl) {
            url = envUrl;
        } else {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname;
            const port = '3001';
            url = `${protocol}//${host}:${port}`;
        }

        console.log('Connecting to Signal Server at:', url);
        this.ws = new WebSocket(url);

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
            this.reconnectAttempts = 0;
            this.pending.forEach(cb => cb.resolve());
            this.pending = [];

            if (this.lastJoinParams) {
                this.send(this.lastJoinParams);
            }
        };

        this.ws.onclose = () => {
            console.log('WS Disconnected');
            this.ws = null;
            this.scheduleReconnect();
        };

        this.ws.onerror = (err) => {
            console.error('WS Error', err);
            try { this.ws?.close(); } catch { /* ignore */ }
            this.pending.forEach(cb => cb.reject(new Error('WebSocket Connection Failed')));
            this.pending = [];
        };
    }

    private scheduleReconnect() {
        if (this.reconnectTimeout) return;

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, up to 30s
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`Scheduling WS reconnect in ${delay}ms... (Attempt ${this.reconnectAttempts + 1})`);

        this.reconnectTimeout = window.setTimeout(() => {
            this.reconnectTimeout = null;
            this.reconnectAttempts++;
            this.connect();
        }, delay);
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

    send(msg: unknown) {
        // We verify that the message is valid via the backend. If it's a join request, we cache it.
        const typedMsg = msg as { type?: string; roomId?: string };
        if (typedMsg.type === 'JOIN_ROOM') {
            this.lastJoinParams = typedMsg;
        }
        if (typedMsg.type === 'LEAVE_ROOM') {
            this.lastJoinParams = null;
        }

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('Socket not open, dropping message');
            return;
        }

        this.ws.send(JSON.stringify(msg));
    }

    subscribe(cb: (msg: unknown) => void) {
        this.listeners.add(cb);
        return () => { this.listeners.delete(cb); };
    }

    // Exposed for testing
    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.ws) {
            this.ws.onclose = null; // prevent reconnect loop
            try { this.ws.close(); } catch { /* ignore */ }
            this.ws = null;
        }
    }
}

export const socket = SocketClient.getInstance();
