import { useState } from 'react';
import VotingCard from './VotingCard';

interface Props {
    availableEstimates: number[];
    onSubmit: (payload: Record<string, unknown>) => void;
    onRetract: () => void;
}

export default function PokerVoting({ availableEstimates, onSubmit, onRetract }: Props) {
    const [selected, setSelected] = useState<number | null>(null);

    const handleVote = (value: number) => {
        if (selected === value) {
            setSelected(null);
            onRetract();
        } else {
            setSelected(value);
            onSubmit({ value });
        }
    };

    return (
        <div className="card poker-voting-card">
            <h3 className="card-title text-center mb-1-5">Select your estimate</h3>
            <div className="card-grid justify-center">
                {availableEstimates.map((val) => (
                    <VotingCard
                        key={val}
                        value={val}
                        isSelected={selected === val}
                        onClick={() => handleVote(val)}
                    />
                ))}
            </div>
        </div>
    );
}
