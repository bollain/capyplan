import { useState } from 'react';
import { Participant } from '@capyplan/protocol';
import { EMOJI_CATEGORIES } from '../constants/emojis';

interface Props {
  onClose: () => void;
  currentUser: Participant;
  onSave: (name: string, emoji: string, isSpectator: boolean) => void;
}

export default function UserSettingsModal({ onClose, currentUser, onSave }: Props) {
  const [name, setName] = useState(currentUser.name);
  const [emoji, setEmoji] = useState(currentUser.emoji || '🐹');
  const [isSpectator, setIsSpectator] = useState(currentUser.isSpectator || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), emoji.trim() || '🐹', isSpectator);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal user-settings-modal" onClick={e => e.stopPropagation()}>
        <h2 className="user-settings-header">User Settings</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="user-settings-form-group">
            <label htmlFor="user-name-input">Display Name</label>
            <input
              id="user-name-input"
              type="text"
              className="user-settings-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Capybara"
              maxLength={20}
              autoComplete="off"
              required
            />
          </div>

          <div className="user-settings-form-group">
            <label>Emoji / Avatar</label>
            <div className="emoji-picker">
              {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                <div key={category}>
                  <h4 className="emoji-category-title">{category}</h4>
                  <div className="emoji-grid">
                    {emojis.map(e => (
                      <button
                        key={e}
                        type="button"
                        className={`emoji-btn ${emoji === e ? 'selected' : ''}`}
                        onClick={() => setEmoji(e)}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="user-settings-form-group" style={{ marginTop: '1.5rem' }}>
            <div className="spectator-toggle" onClick={() => setIsSpectator(!isSpectator)}>
              <div className={`toggle-track ${isSpectator ? 'active' : ''}`}>
                <div className={`toggle-thumb ${isSpectator ? 'active' : ''}`}></div>
              </div>
              <span className="spectator-label">Spectator Mode</span>
            </div>
          </div>

          <div className="user-settings-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-prominent-std" disabled={!name.trim()}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
