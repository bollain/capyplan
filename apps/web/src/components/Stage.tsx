import { RoomPhase, RoomState, EstimationMode } from '@capyplan/protocol';
import EstimationResults from './EstimationResults';
import VotingArea from './VotingArea';

interface Props {
    phase: RoomPhase;
    mode: EstimationMode;
    availableEstimates?: number[];
    results?: RoomState['results'];
    participants: RoomState['participants'];
    onSubmitEstimate: (payload: any) => void;
}

export default function Stage({ phase, mode, availableEstimates, results, participants, onSubmitEstimate }: Props) {
    return (
        <div className="card">
            {phase === RoomPhase.REVEALED && results ? (
                <EstimationResults results={results} participants={participants} estimationMode={mode} />
            ) : (
                <>
                    <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Cast your vote:</p>
                    <VotingArea
                        mode={mode}
                        availableEstimates={availableEstimates}
                        onSubmit={onSubmitEstimate}
                    />
                </>
            )}
        </div>
    );
}
