import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import Room from '../Room';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { socket } from '../../lib/socket';

// Mock socket using spyOn to ensure we touch the singleton instance
let socketListeners: ((data: any) => void)[] = [];

// Helper to simulate server messages
const emitToSocket = (data: any) => {
    socketListeners.forEach(l => l(data));
};

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: vi.fn(),
    },
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => 'mock-client-id-123',
    },
});

// Mock localStorage
const localStorageMock = (function () {
    let store: Record<string, string> = {
        'capyplan_username': 'Alice'
    };
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Room Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        socketListeners = [];
        localStorageMock.setItem('capyplan_username', 'Alice');
        localStorageMock.setItem('capyplan_client_id', 'mock-client-id-123');

        // Spy on socket methods
        vi.spyOn(socket, 'connect').mockImplementation(() => { });
        vi.spyOn(socket, 'waitForOpen').mockResolvedValue(undefined);
        vi.spyOn(socket, 'send').mockImplementation(() => { });
        vi.spyOn(socket, 'subscribe').mockImplementation((callback) => {
            socketListeners.push(callback);
            return () => {
                socketListeners = socketListeners.filter(l => l !== callback);
            };
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderRoom = (roomId = 'room-123') => {
        render(
            <MemoryRouter initialEntries={[`/room/${roomId}`]}>
                <Routes>
                    <Route path="/room/:roomId" element={<Room />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('connects and joins room on mount', async () => {
        renderRoom();

        expect(socket.connect).toHaveBeenCalled();
        // Wait for waitForOpen promise chain
        await act(async () => {
            await Promise.resolve();
        });

        expect(socket.send).toHaveBeenCalledWith(expect.objectContaining({
            type: 'JOIN_ROOM',
            roomId: 'room-123',
            name: 'Alice'
        }));
    });

    it('displays loading state initially', () => {
        renderRoom();
        expect(screen.getByText('Loading Room...')).toBeInTheDocument();
    });

    it('renders room state after receiving snapshot', async () => {
        renderRoom();

        // Simulate server sending snapshot
        await act(async () => {
            emitToSocket({
                type: 'ROOM_SNAPSHOT',
                state: {
                    roomId: 'room-123',
                    roomName: 'Planning Poker',
                    phase: 'VOTING',
                    estimationMode: 'PERT',
                    leaderId: 'mock-client-id-123',
                    participants: [
                        { id: 'mock-client-id-123', name: 'Alice', connected: true, isSpectator: false }
                    ],
                    results: {},
                    currentEstimates: {},
                    availableEstimates: [1, 2, 3] // Must be numbers for PERT input? Or just to pass check
                }
            });
        });

        expect(screen.getByText('Planning Poker')).toBeInTheDocument();
        expect(screen.getByText('Alice (You)')).toBeInTheDocument();
        expect(screen.queryByText('Loading Room...')).not.toBeInTheDocument();
    });

    it('submits estimate when voting card is clicked', async () => {
        renderRoom();

        // Send snapshot first
        await act(async () => {
            emitToSocket({
                type: 'ROOM_SNAPSHOT',
                state: {
                    roomId: 'room-123',
                    roomName: 'Planning Poker',
                    phase: 'VOTING',
                    estimationMode: 'PERT',
                    leaderId: 'other-id',
                    participants: [
                        { id: 'mock-client-id-123', name: 'Alice', connected: true, isSpectator: false }
                    ],
                    results: {},
                    currentEstimates: {},
                    availableEstimates: [1, 2, 3, 5, 8]
                }
            });
        });

        // Use within() to scope clicks to specific rows
        // Note: PERT voting auto-submits when all inputs are filled

        const optimisticRow = screen.getByText('Optimistic').closest('.pert-row') as HTMLElement;
        fireEvent.click(within(optimisticRow).getByText('3'));

        const likelyRow = screen.getByText('Most Likely').closest('.pert-row') as HTMLElement;
        fireEvent.click(within(likelyRow).getByText('5'));

        const pessimisticRow = screen.getByText('Pessimistic').closest('.pert-row') as HTMLElement;
        fireEvent.click(within(pessimisticRow).getByText('8'));

        // Auto-submits when all 3 are selected

        expect(socket.send).toHaveBeenCalledWith(expect.objectContaining({
            type: 'SUBMIT_ESTIMATE',
            payload: {
                optimistic: 3,
                mostLikely: 5,
                pessimistic: 8
            }
        }));
    });
});
