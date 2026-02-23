import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import Room from '../Room';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { socket } from '../../lib/socket';

// Mock socket using spyOn to ensure we touch the singleton instance
let socketListeners: ((data: unknown) => void)[] = [];

// Helper to simulate server messages
const emitToSocket = (data: unknown) => {
    socketListeners.forEach(l => l(data));
};

import { ThemeProvider } from '../../context/ThemeProvider';

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: vi.fn(),
    },
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
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
            <ThemeProvider>
                <MemoryRouter initialEntries={[`/room/${roomId}`]}>
                    <Routes>
                        <Route path="/room/:roomId" element={<Room />} />
                    </Routes>
                </MemoryRouter>
            </ThemeProvider>
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
        expect(screen.getByText('Capy is sniffing for your room...')).toBeInTheDocument();
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
    it('allows reveal when all active participants have voted (ignoring spectators)', async () => {
        renderRoom();

        await act(async () => {
            emitToSocket({
                type: 'ROOM_SNAPSHOT',
                state: {
                    roomId: 'room-123',
                    roomName: 'Spectator Test',
                    phase: 'VOTING',
                    estimationMode: 'PERT',
                    leaderId: 'mock-client-id-123', // Alice is leader (current user)
                    participants: [
                        { id: 'mock-client-id-123', name: 'Alice', connected: true, isSpectator: false },
                        { id: 'bob-id', name: 'Bob', connected: true, isSpectator: true } // Spectator!
                    ],
                    results: {},
                    currentEstimates: {
                        'mock-client-id-123': { optimistic: 1, mostLikely: 2, pessimistic: 3 }
                    },
                    availableEstimates: [1, 2, 3]
                }
            });
        });

        // Alice has voted. Bob is spectator.
        // totalParticipants should only count NON-spectators.
        // So totalParticipants = 1 (Alice). voteCount = 1 (Alice).
        // allVoted = true.

        const button = screen.getByRole('button', { name: /Reveal All Estimates/i });
        expect(button).toBeInTheDocument();
        expect(button).toBeEnabled();
        expect(screen.getByText('⚡ Reveal All Estimates')).toBeInTheDocument();
    });

    it('allows reveal when at least one person has voted (partial)', async () => {
        renderRoom();

        await act(async () => {
            emitToSocket({
                type: 'ROOM_SNAPSHOT',
                state: {
                    roomId: 'room-partial',
                    roomName: 'Partial Test',
                    phase: 'VOTING',
                    estimationMode: 'PERT',
                    leaderId: 'mock-client-id-123',
                    participants: [
                        { id: 'mock-client-id-123', name: 'Alice', connected: true },
                        { id: 'bob-id', name: 'Bob', connected: true }
                    ],
                    results: {},
                    currentEstimates: {
                        'mock-client-id-123': { optimistic: 1, mostLikely: 2, pessimistic: 3 }
                    },
                    availableEstimates: [1, 2, 3]
                }
            });
        });

        // Alice voted, Bob didn't. 
        // Button should be ENABLED but NOT "All Estimates"
        const button = screen.getByRole('button', { name: /Reveal Estimates/i });
        expect(button).toBeEnabled();
        expect(screen.getByText('Reveal Estimates (1/2)')).toBeInTheDocument();
        expect(screen.queryByText('⚡ Reveal All Estimates')).not.toBeInTheDocument();
    });

    it('sends retraction when vote is toggled off', async () => {
        renderRoom();

        // Simulate PERT vote being selected
        await act(async () => {
            emitToSocket({
                type: 'ROOM_SNAPSHOT',
                state: {
                    roomId: 'room-123',
                    roomName: 'Retract Test',
                    phase: 'VOTING',
                    estimationMode: 'PERT',
                    leaderId: 'mock-client-id-123',
                    participants: [{ id: 'mock-client-id-123', name: 'Alice', connected: true }],
                    results: {},
                    currentEstimates: {},
                    availableEstimates: [1, 2, 3]
                }
            });
        });

        // 1. Select a vote first
        const optimisticRow = screen.getByText('Optimistic').closest('.pert-row') as HTMLElement;
        const button = within(optimisticRow).getByText('2');
        fireEvent.click(button);

        // 2. Click it again to deselect (retract)
        fireEvent.click(button);

        // 3. Verify RETRACT_VOTE is sent
        expect(socket.send).toHaveBeenCalledWith(expect.objectContaining({
            type: 'RETRACT_VOTE'
        }));
    });
});
