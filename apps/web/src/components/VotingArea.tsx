import { EstimationMode } from '@capyplan/protocol';
import PertVoting from './PertVoting';

interface Props {
    mode: EstimationMode;
    availableEstimates?: number[];
    onSubmit: (payload: any) => void;
}

export default function VotingArea({ mode, availableEstimates, onSubmit }: Props) {
    if (!availableEstimates) {
        return <div>Waiting for room configuration...</div>;
    }

    if (mode === EstimationMode.PERT) {
        return (
            <PertVoting
                availableEstimates={availableEstimates}
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
