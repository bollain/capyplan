import { EstimationMode } from '@capyplan/protocol';
import PertVoting from './PertVoting';
import PokerVoting from './PokerVoting';
import { DEFAULT_DECK } from '../constants/decks';

interface Props {
    mode: EstimationMode;
    availableEstimates?: number[];
    onSubmit: (payload: Record<string, unknown>) => void;
    onRetract: () => void;
}

export default function VotingArea({ mode, availableEstimates, onSubmit, onRetract }: Props) {
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
                onRetract={onRetract}
            />
        );
    }

    if (mode === EstimationMode.POKER) {
        return (
            <PokerVoting
                availableEstimates={estimates}
                onSubmit={onSubmit}
                onRetract={onRetract}
            />
        );
    }

    return (
        <div className="unsupported-mode">
            Unsupported Estimation Mode: {mode}
        </div>
    );
}
