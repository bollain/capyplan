import { useEffect, useState } from 'react';
import { DisagreementLevel, INTERLUDE_COPY } from '../constants/interludeMessages';

interface Props {
    isVisible: boolean;
    disagreementLevel?: DisagreementLevel;
}

export default function InterludePill({ isVisible, disagreementLevel = DisagreementLevel.Low }: Props) {
    const [message, setMessage] = useState('');
    const [isExiting, setIsExiting] = useState(false);
    const [shouldRender, setShouldRender] = useState(isVisible);
    const [prevVisible, setPrevVisible] = useState(isVisible);

    if (isVisible !== prevVisible) {
        setPrevVisible(isVisible);
        if (isVisible) {
            // Generate message immediately when becoming visible
            // This runs during the state adjustment pass, so the result is stored in state
            // and remains stable for the committed render.
            const messages = INTERLUDE_COPY[disagreementLevel];
            // eslint-disable-next-line react-hooks/purity
            setMessage(messages[Math.floor(Math.random() * messages.length)]);
            setShouldRender(true);
            setIsExiting(false);
        } else {
            setIsExiting(true);
        }
    }

    useEffect(() => {
        if (!isVisible && shouldRender) {
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 300); // Match CSS animation duration
            return () => clearTimeout(timer);
        }
    }, [isVisible, shouldRender]);

    if (!shouldRender) return null;

    return (
        <div className="interlude-overlay">
            <div className={`interlude-pill ${isExiting ? 'exiting' : ''}`}>
                <span className="interlude-icon">✨</span>
                <span className="interlude-text">{message}</span>
                <div className="interlude-loader"></div>
            </div>
        </div>
    );
}
