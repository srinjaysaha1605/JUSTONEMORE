import React from 'react';
import { Monitor, Palette, Volume2, VolumeX } from 'lucide-react';
import type { ArcadeTheme } from '../engine/types';

interface DisplayControlsProps {
  soundEnabled: boolean;
  crtEnabled: boolean;
  theme: ArcadeTheme;
  onToggleSound: () => void;
  onToggleCrt: () => void;
  onToggleTheme: () => void;
  compact?: boolean;
}

export const DisplayControls: React.FC<DisplayControlsProps> = ({
  soundEnabled,
  crtEnabled,
  theme,
  onToggleSound,
  onToggleCrt,
  onToggleTheme,
  compact = false,
}) => {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={`Switch theme (current: ${theme === 'mono' ? 'Black and White' : 'Game Boy Green'})`}
        title="Switch LCD Theme"
        className="pixel-btn bg-[var(--bg-screen)] px-2.5 py-2 font-pixel text-xs text-[var(--ink-primary)] inline-flex items-center gap-1.5 whitespace-nowrap"
      >
        <Palette className="w-4 h-4 shrink-0" />
        <span>{theme === 'mono' ? 'B&W' : 'GREEN'}</span>
      </button>

      <button
        type="button"
        onClick={onToggleCrt}
        aria-label={crtEnabled ? 'Disable CRT scanlines' : 'Enable CRT scanlines'}
        title="Toggle CRT Scanlines"
        className={`pixel-btn px-2.5 py-2 font-pixel text-xs inline-flex items-center gap-1.5 whitespace-nowrap ${
          crtEnabled
            ? 'bg-[var(--bg-screen)] text-[var(--ink-primary)]'
            : 'bg-[var(--bg-surface)] text-[var(--ink-muted)]'
        }`}
      >
        <Monitor className="w-4 h-4 shrink-0" />
        <span>{crtEnabled ? 'CRT ON' : 'CRT OFF'}</span>
      </button>

      <button
        type="button"
        onClick={onToggleSound}
        aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
        title="Toggle Sound"
        className="pixel-btn bg-[var(--bg-screen)] px-2.5 py-2 font-pixel text-xs text-[var(--ink-primary)] inline-flex items-center gap-1.5 whitespace-nowrap"
      >
        {soundEnabled ? (
          <Volume2 className="w-4 h-4 shrink-0" />
        ) : (
          <VolumeX className="w-4 h-4 shrink-0" />
        )}
        {!compact && <span>{soundEnabled ? 'SFX ON' : 'SFX OFF'}</span>}
      </button>
    </div>
  );
};
