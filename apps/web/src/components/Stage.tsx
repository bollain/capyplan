import { RoomPhase, RoomState, EstimationMode } from '@capyplan/protocol';
import EstimationResults from './EstimationResults';
import VotingArea from './VotingArea';

interface Props {
    phase: RoomPhase;
    mode: EstimationMode;
    availableEstimates?: number[];
    results?: RoomState['results'];
    currentEstimates?: RoomState['currentEstimates'];
    participants: RoomState['participants'];
    isSpectator: boolean;
    onSubmitEstimate: (payload: Record<string, unknown>) => void;
    onRetractEstimate: () => void;
}

export default function Stage({ phase, mode, availableEstimates, results, currentEstimates, participants, isSpectator, onSubmitEstimate, onRetractEstimate }: Props) {
    return (
        <div className="card">
            {phase === RoomPhase.REVEALED && results ? (
                <EstimationResults results={results} currentEstimates={currentEstimates} participants={participants} estimationMode={mode} />
            ) : (
                <>
                    {isSpectator ? (
                        <p className="stage-instruction">You are a spectator. Waiting for the team to vote...</p>
                    ) : (
                        <>
                            <p className="stage-instruction">Cast your vote:</p>
                            <VotingArea
                                mode={mode}
                                availableEstimates={availableEstimates}
                                onSubmit={onSubmitEstimate}
                                onRetract={onRetractEstimate}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
}
