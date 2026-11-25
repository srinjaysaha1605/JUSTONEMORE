import React, { useEffect, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import type { ArcadeTheme } from '../engine/types';
import { DisplayControls } from './DisplayControls';
import { ZeroLogo } from './ZeroLogo';

interface LandingScreenProps {
  soundEnabled: boolean;
  crtEnabled: boolean;
  theme: ArcadeTheme;
  onToggleSound: () => void;
  onToggleCrt: () => void;
  onToggleTheme: () => void;
  onEnterArcade: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  soundEnabled,
  crtEnabled,
  theme,
  onToggleSound,
  onToggleCrt,
  onToggleTheme,
  onEnterArcade,
}) => {
  const [boosting, setBoosting] = useState(false);

  const handleStart = () => {
    if (boosting) return;
    setBoosting(true);
    soundEngine.boot();
    window.setTimeout(() => {
      onEnterArcade();
    }, 140);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-between px-4 sm:px-8 lg:px-12 py-6 sm:py-8 bg-[var(--bg-casing)] overflow-hidden">
      {/* Top-right Theme, CRT, and Sound controls */}
      <div className="w-full flex justify-end">
        <DisplayControls
          soundEnabled={soundEnabled}
          crtEnabled={crtEnabled}
          theme={theme}
          onToggleSound={onToggleSound}
          onToggleCrt={onToggleCrt}
          onToggleTheme={onToggleTheme}
        />
      </div>

      {/* Centerpiece */}
      <section className="flex flex-col items-center text-center max-w-2xl my-auto py-8">
        <ZeroLogo
          size="lg"
          interactive
          boosting={boosting}
          onClick={() => soundEngine.click()}
        />

        <h1 className="mt-8 font-pixel text-4xl sm:text-5xl lg:text-6xl tracking-wider text-[var(--ink-primary)]">
          JUSTONEMORE
        </h1>

        <p className="mt-3 font-mono-body text-sm sm:text-base lg:text-lg tracking-widest text-[var(--ink-muted)]">
          INSERT COIN. LOSE NOTHING.
        </p>

        <button
          type="button"
          data-start="true"
          onClick={handleStart}
          className="mt-8 pixel-btn-primary px-8 sm:px-10 py-4 font-pixel text-base sm:text-lg lg:text-xl tracking-wider whitespace-nowrap"
        >
          ENTER ARCADE
        </button>
      </section>

      <footer className="text-center text-xs sm:text-sm font-mono-body text-[var(--ink-muted)] opacity-80 tracking-wide">
        CLICK DICE TO SPARK · PRESS ENTER OR SPACE TO BOOT
      </footer>
    </main>
  );
};
