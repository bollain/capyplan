import { RoomState, EstimationMode } from '@capyplan/protocol';
import PertResults from './PertResults';
import PokerResults from './PokerResults';

interface Props {
    results: NonNullable<RoomState['results']>;
    participants: RoomState['participants'];
    currentEstimates: RoomState['currentEstimates'];
    estimationMode: EstimationMode;
}

export default function EstimationResults({ results, participants, currentEstimates, estimationMode }: Props) {
    if (estimationMode === EstimationMode.PERT) {
        return <PertResults results={results} participants={participants} currentEstimates={currentEstimates} />;
    }

    if (estimationMode === EstimationMode.POKER) {
        return <PokerResults results={results} participants={participants} />;
    }

    return <div className="unsupported-mode">Unsupported Estimation Mode: {estimationMode}</div>;
}
