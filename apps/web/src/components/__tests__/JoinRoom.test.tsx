import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JoinRoom from '../JoinRoom';

describe('JoinRoom', () => {
    it('renders input and join button', () => {
        render(<JoinRoom roomId="room-123" onJoin={() => { }} />);
        expect(screen.getByPlaceholderText('Capybara Joe')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Join Room/i })).toBeInTheDocument();
        // Spectator checkbox should be present
        expect(screen.getByText(/Join as Spectator/i)).toBeInTheDocument();
    });

    it('handles input changes', () => {
        render(<JoinRoom roomId="room-123" onJoin={() => { }} />);
        const input = screen.getByPlaceholderText('Capybara Joe') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'Alice' } });
        expect(input.value).toBe('Alice');
    });

    it('calls onJoin when form is submitted', () => {
        const handleJoin = vi.fn();
        render(<JoinRoom roomId="room-123" onJoin={handleJoin} />);

        const input = screen.getByPlaceholderText('Capybara Joe');
        fireEvent.change(input, { target: { value: 'Alice' } });

        const button = screen.getByRole('button', { name: /Join Room/i });
        fireEvent.click(button);

        expect(handleJoin).toHaveBeenCalledWith('Alice', false);
    });

    it('calls onJoin with spectator mode correct', () => {
        const handleJoin = vi.fn();
        render(<JoinRoom roomId="room-123" onJoin={handleJoin} />);

        const input = screen.getByPlaceholderText('Capybara Joe');
        fireEvent.change(input, { target: { value: 'Bob' } });

        const checkbox = screen.getByText(/Join as Spectator/i);
        fireEvent.click(checkbox);

        const button = screen.getByRole('button', { name: /Join Room/i });
        fireEvent.click(button);

        expect(handleJoin).toHaveBeenCalledWith('Bob', true);
    });

    it('does not submit if name is empty', () => {
        const handleJoin = vi.fn();
        render(<JoinRoom roomId="room-123" onJoin={handleJoin} />);

        const button = screen.getByRole('button', { name: /Join Room/i });
        fireEvent.click(button);

        expect(handleJoin).not.toHaveBeenCalled();
    });
});
