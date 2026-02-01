import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParticipantList from '../ParticipantList';


// Participants: name, id, isSpectator, connected
describe('ParticipantList', () => {
    const mockParticipants = [
        { id: 'p1', name: 'Alice', connected: true, isSpectator: false, emoji: '😀' },
        { id: 'p2', name: 'Bob', connected: true, isSpectator: false, emoji: '😎' },
    ];
    const emptyEstimates = {};

    it('renders list of participants', () => {
        render(<ParticipantList
            participants={mockParticipants}
            leaderId="p1"
            currentEstimates={emptyEstimates}
        />);

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('Participants (2)')).toBeInTheDocument();
    });

    it('marks the current user', () => {
        render(<ParticipantList
            participants={mockParticipants}
            leaderId="p1"
            currentUserName="Alice"
            currentEstimates={emptyEstimates}
        />);

        expect(screen.getByText('Alice (You)')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('displays leader icon', () => {
        render(<ParticipantList
            participants={mockParticipants}
            leaderId="p2"
            currentEstimates={emptyEstimates}
        />);

        // Use title attribute for finding icons if they are accessible
        expect(screen.getByTitle('Leader')).toBeInTheDocument();
    });

    it('displays spectator icon', () => {
        const spectators = [
            { id: 's1', name: 'Watcher', connected: true, isSpectator: true, emoji: '👀' }
        ];
        render(<ParticipantList
            participants={spectators}
            leaderId="s1"
            currentEstimates={emptyEstimates}
        />);

        expect(screen.getByTitle('Spectator')).toBeInTheDocument();
    });

    it('displays disconnected status', () => {
        const disconnected = [
            { id: 'd1', name: 'Ghost', connected: false, isSpectator: false, emoji: '👻' }
        ];
        render(<ParticipantList
            participants={disconnected}
            leaderId="none"
            currentEstimates={emptyEstimates}
        />);

        expect(screen.getByTitle('Disconnected')).toBeInTheDocument();
        const item = screen.getByText('Ghost').closest('li');
        expect(item).toHaveClass('disconnected');
    });

    it('shows checkmark when participant has estimated', () => {
        const estimates = { 'p1': { score: 5, revealed: false } };
        render(<ParticipantList
            participants={mockParticipants}
            leaderId="p1"
            currentEstimates={estimates}
        />);

        // Find the list item for Alice and check for checkmark
        // Using a more robust lookup if possible, or just text content '✅'
        expect(screen.getByText('✅')).toBeInTheDocument();
    });
});
