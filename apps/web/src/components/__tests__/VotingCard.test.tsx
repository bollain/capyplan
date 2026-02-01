import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VotingCard from '../VotingCard';

describe('VotingCard', () => {
    it('renders the value properly', () => {
        render(<VotingCard value={5} isSelected={false} onClick={() => { }} />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('applies selected class when isSelected is true', () => {
        render(<VotingCard value={3} isSelected={true} onClick={() => { }} />);
        const button = screen.getByText('3');
        expect(button).toHaveClass('selected');
    });

    it('does not apply selected class when isSelected is false', () => {
        render(<VotingCard value={8} isSelected={false} onClick={() => { }} />);
        const button = screen.getByText('8');
        expect(button).not.toHaveClass('selected');
    });

    it('calls onClick handler when clicked', () => {
        const handleClick = vi.fn();
        render(<VotingCard value={1} isSelected={false} onClick={handleClick} />);

        fireEvent.click(screen.getByText('1'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});
