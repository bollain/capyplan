import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from '../Home';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeProvider';

// Mock the socket
vi.mock('../../lib/socket', () => ({
    socket: {
        connect: vi.fn(),
    },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
    value: {
        randomUUID: () => 'mock-uuid-1234',
    },
});

// Mock localStorage
const localStorageMock = (function () {
    let store: Record<string, string> = {};
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

describe('Home Page', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    const renderHome = () => {
        render(
            <ThemeProvider>
                <BrowserRouter>
                    <Home />
                </BrowserRouter>
            </ThemeProvider>
        );
    };

    it('renders initial state correctly (Create Room mode)', () => {
        renderHome();

        expect(screen.getByText('CapyPlan')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Sprint Planning 34')).toBeInTheDocument(); // Room Name placeholder
        expect(screen.getByText('Create Room')).toBeInTheDocument();
        expect(screen.getByText(/or join existing room by ID/i)).toBeInTheDocument();

        // Button should be disabled initially
        expect(screen.getByRole('button', { name: 'Create Room' })).toBeDisabled();
    });

    it('switches to Join Room mode', () => {
        renderHome();

        // Click "or join existing room by ID"
        fireEvent.click(screen.getByText(/or join existing room by ID/i));

        expect(screen.getByText('Room ID')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('paste-room-id-here')).toBeInTheDocument();
        expect(screen.getByText('Join Room')).toBeInTheDocument();
        expect(screen.getByText(/or create a new room/i)).toBeInTheDocument();
    });

    it('enables button when form is filled', () => {
        renderHome();

        const nameInput = screen.getByPlaceholderText('Capybara Joe');
        const roomInput = screen.getByPlaceholderText('Sprint Planning 34');

        fireEvent.change(nameInput, { target: { value: 'Alice' } });
        fireEvent.change(roomInput, { target: { value: 'My Room' } });

        expect(screen.getByRole('button', { name: 'Create Room' })).toBeEnabled();
    });

    it('navigates to room on create', () => {
        renderHome();

        const nameInput = screen.getByPlaceholderText('Capybara Joe');
        const roomInput = screen.getByPlaceholderText('Sprint Planning 34');

        fireEvent.change(nameInput, { target: { value: 'Alice' } });
        fireEvent.change(roomInput, { target: { value: 'My Room' } });

        fireEvent.click(screen.getByRole('button', { name: 'Create Room' }));

        expect(mockNavigate).toHaveBeenCalledWith('/room/mock-uuid-1234', {
            state: {
                name: 'Alice',
                isSpectator: false,
                roomName: 'My Room',
            },
        });
    });

    it('navigates to room on join', () => {
        renderHome();

        // Switch to Join mode
        fireEvent.click(screen.getByText(/or join existing room by ID/i));

        const nameInput = screen.getByPlaceholderText('Capybara Joe');
        const roomInput = screen.getByPlaceholderText('paste-room-id-here');

        fireEvent.change(nameInput, { target: { value: 'Bob' } });
        fireEvent.change(roomInput, { target: { value: 'existing-room-id' } });

        fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));

        expect(mockNavigate).toHaveBeenCalledWith('/room/existing-room-id', {
            state: {
                name: 'Bob',
                isSpectator: false,
                roomName: undefined,
            },
        });
    });

    it('toggles spectator mode', () => {
        renderHome();

        const toggle = screen.getByText('Join as Spectator');
        fireEvent.click(toggle);

        // Verify state passed on navigation
        const nameInput = screen.getByPlaceholderText('Capybara Joe');
        const roomInput = screen.getByPlaceholderText('Sprint Planning 34');
        fireEvent.change(nameInput, { target: { value: 'Observer' } });
        fireEvent.change(roomInput, { target: { value: 'Demo' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create Room' }));

        expect(mockNavigate).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            state: expect.objectContaining({
                isSpectator: true
            })
        }));
    });
});
