import { useState, useEffect } from 'react';
import VotingCard from './VotingCard';

interface Props {
    availableEstimates: number[];
    onSubmit: (payload: { optimistic: number; mostLikely: number; pessimistic: number }) => void;
    onRetract: () => void;
}

export default function PertVoting({ availableEstimates, onSubmit, onRetract }: Props) {
    const [optimistic, setOptimistic] = useState<number | null>(null);
    const [mostLikely, setMostLikely] = useState<number | null>(null);
    const [pessimistic, setPessimistic] = useState<number | null>(null);

    // Auto-submit when all three are selected
    useEffect(() => {
        if (optimistic !== null && mostLikely !== null && pessimistic !== null) {
            onSubmit({
                optimistic,
                mostLikely,
                pessimistic
            });
        }
    }, [optimistic, mostLikely, pessimistic, onSubmit]);

    const handleToggle = (
        val: number,
        currentVal: number | null,
        setter: (v: number | null) => void
    ) => {
        if (currentVal === val) {
            // Deselect logic
            setter(null);
            // If we deselect any, the vote is no longer complete
            onRetract();
        } else {
            setter(val);
        }
    };

    const renderRow = (
        label: string,
        currentVal: number | null,
        setter: (v: number | null) => void
    ) => (
        <div className="pert-row">
            <div className="pert-label">
                {label}
            </div>
            <div className="card-grid">
                {availableEstimates.map(val => (
                    <VotingCard
                        key={val}
                        value={val}
                        isSelected={currentVal === val}
                        onClick={() => handleToggle(val, currentVal, setter)}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="mt-1">
            {renderRow('Optimistic', optimistic, setOptimistic)}
            {renderRow('Most Likely', mostLikely, setMostLikely)}
            {renderRow('Pessimistic', pessimistic, setPessimistic)}
        </div>
    );
}
