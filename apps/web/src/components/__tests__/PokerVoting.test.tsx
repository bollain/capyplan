import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PokerVoting from '../PokerVoting';

describe('PokerVoting', () => {
    const defaultProps = {
        availableEstimates: [1, 2, 3, 5, 8],
        onSubmit: vi.fn(),
        onRetract: vi.fn(),
    };

    it('renders available estimates', () => {
        render(<PokerVoting {...defaultProps} />);
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('submits value when clicking an estimate', () => {
        render(<PokerVoting {...defaultProps} />);
        fireEvent.click(screen.getByText('5'));
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({ value: 5 });
    });

    it('retracts vote when clicking the active estimate again', () => {
        render(<PokerVoting {...defaultProps} />);
        const btn = screen.getByText('3');
        fireEvent.click(btn); // Select
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({ value: 3 });
        
        fireEvent.click(btn); // Unselect
        expect(defaultProps.onRetract).toHaveBeenCalled();
    });
});
