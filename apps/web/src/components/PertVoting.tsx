import { useState, useEffect } from 'react';
import VotingCard from './VotingCard';

interface Props {
    availableEstimates: number[];
    onSubmit: (payload: { optimistic: number; mostLikely: number; pessimistic: number }) => void;
}

export default function PertVoting({ availableEstimates, onSubmit }: Props) {
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

    const renderRow = (label: string, currentVal: number | null, setVal: (v: number) => void) => (
        <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {label}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {availableEstimates.map(val => (
                    <VotingCard
                        key={val}
                        value={val}
                        isSelected={currentVal === val}
                        onClick={() => setVal(val)}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div style={{ marginTop: '1rem' }}>
            {renderRow('Optimistic', optimistic, setOptimistic)}
            {renderRow('Most Likely', mostLikely, setMostLikely)}
            {renderRow('Pessimistic', pessimistic, setPessimistic)}
        </div>
    );
}
