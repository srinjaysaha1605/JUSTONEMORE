import React, { useState } from 'react';
import { X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import type { ArcadeSettings } from '../engine/types';

interface SettingsModalProps {
  settings: ArcadeSettings;
  onUpdate: (patch: Partial<ArcadeSettings>) => void;
  onReset: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdate,
  onReset,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-4"
    >
      <div className="lcd-screen w-full max-w-md p-4 sm:p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b-2 border-[var(--border-lcd)] pb-3">
          <h2
            id="settings-modal-title"
            className="font-pixel text-base sm:text-lg text-[var(--ink-primary)]"
          >
            SYSTEM SETTINGS
          </h2>
          <button
            type="button"
            onClick={() => {
              soundEngine.click();
              onClose();
            }}
            aria-label="Close settings"
            className="pixel-btn bg-[var(--bg-surface)] p-2 text-[var(--ink-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="lcd-panel p-3 flex items-center justify-between">
            <span className="font-pixel text-xs text-[var(--ink-primary)]">
              DISPLAY THEME
            </span>
            <button
              type="button"
              onClick={() => {
                soundEngine.click();
                onUpdate({
                  theme: settings.theme === 'mono' ? 'green' : 'mono',
                });
              }}
              className="pixel-btn bg-[var(--accent)] text-[var(--accent-ink)] px-3 py-1.5 font-pixel text-xs"
            >
              {settings.theme === 'mono' ? 'B&W' : 'GREEN'}
            </button>
          </div>

          <div className="lcd-panel p-3 flex items-center justify-between">
            <span className="font-pixel text-xs text-[var(--ink-primary)]">
              RETRO SOUND FX
            </span>
            <button
              type="button"
              onClick={() => {
                const next = !settings.soundEnabled;
                onUpdate({ soundEnabled: next });
                if (next) soundEngine.click();
              }}
              className={`pixel-btn px-3 py-1.5 font-pixel text-xs ${
                settings.soundEnabled
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'bg-[var(--bg-screen)] text-[var(--ink-muted)]'
              }`}
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="lcd-panel p-3 flex items-center justify-between">
            <span className="font-pixel text-xs text-[var(--ink-primary)]">
              CRT SCANLINES
            </span>
            <button
              type="button"
              onClick={() => {
                soundEngine.click();
                onUpdate({ scanlinesEnabled: !settings.scanlinesEnabled });
              }}
              className={`pixel-btn px-3 py-1.5 font-pixel text-xs ${
                settings.scanlinesEnabled
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'bg-[var(--bg-screen)] text-[var(--ink-muted)]'
              }`}
            >
              {settings.scanlinesEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="lcd-panel p-3 flex items-center justify-between">
            <span className="font-pixel text-xs text-[var(--ink-primary)]">
              SCREEN FLICKER
            </span>
            <button
              type="button"
              onClick={() => {
                soundEngine.click();
                onUpdate({ flickerEnabled: !settings.flickerEnabled });
              }}
              className={`pixel-btn px-3 py-1.5 font-pixel text-xs ${
                settings.flickerEnabled
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'bg-[var(--bg-screen)] text-[var(--ink-muted)]'
              }`}
            >
              {settings.flickerEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="border-t-2 border-[var(--border-lcd)] pt-4 flex flex-col gap-3">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.click();
                setConfirmReset(true);
              }}
              className="pixel-btn bg-[var(--bg-screen)] py-2.5 font-pixel text-xs text-[var(--ink-primary)]"
            >
              RESET SAVE DATA
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="font-mono-body text-xs text-[var(--ink-primary)]">
                Reset balance to 1,000 ZC and clear stats and history?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setConfirmReset(false);
                    onClose();
                  }}
                  className="pixel-btn-primary py-2 font-pixel text-xs"
                >
                  CONFIRM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.click();
                    setConfirmReset(false);
                  }}
                  className="pixel-btn bg-[var(--bg-screen)] py-2 font-pixel text-xs text-[var(--ink-primary)]"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}

          <p className="font-mono-body text-[11px] text-[var(--ink-muted)] leading-relaxed">
            JUSTONEMORE is a free-to-play parody arcade simulator. ZERO COINS
            have zero cash value. The house always wins. Probably.
          </p>
        </div>
      </div>
    </div>
  );
};
