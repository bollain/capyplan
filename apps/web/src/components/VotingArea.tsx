import { EstimationMode } from '@capyplan/protocol';
import PertVoting from './PertVoting';
import { DEFAULT_DECK } from '../constants/decks';

interface Props {
    mode: EstimationMode;
    availableEstimates?: number[];
    onSubmit: (payload: Record<string, unknown>) => void;
}

export default function VotingArea({ mode, availableEstimates, onSubmit }: Props) {
    const estimates = availableEstimates || DEFAULT_DECK;

    // Note: If we really wanted to wait, we'd check for empty array specifically, but default handles it.
    if (!estimates || estimates.length === 0) {
        return <div>Waiting for room configuration...</div>;
    }

    if (mode === EstimationMode.PERT) {
        return (
            <PertVoting
                availableEstimates={estimates}
                onSubmit={onSubmit}
            />
        );
    }

    return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>
            Unsupported Estimation Mode: {mode}
        </div>
    );
}
