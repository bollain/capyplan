import { useMemo } from 'react';
import { DisagreementLevel, INTERLUDE_COPY } from '../constants/interludeMessages';

interface Props {
    disagreementLevel?: DisagreementLevel;
}

export default function InterludePill({ disagreementLevel = DisagreementLevel.Low }: Props) {
    const message = useMemo(() => {
        const messages = INTERLUDE_COPY[disagreementLevel];
        // eslint-disable-next-line react-hooks/purity
        return messages[Math.floor(Math.random() * messages.length)];
    }, [disagreementLevel])

    return (
        <div className="interlude-overlay">
            <div className="interlude-pill">
                <span className="interlude-icon">✨</span>
                <span className="interlude-text">{message}</span>
                <div className="interlude-loader"></div>
            </div>
        </div>
    );
}
