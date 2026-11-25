import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import type { ArcadeTheme } from '../engine/types';
import { BalanceBadge } from './BalanceBadge';
import { DisplayControls } from './DisplayControls';

interface GameShellProps {
  title: string;
  instruction: string;
  balance: number;
  soundEnabled: boolean;
  crtEnabled: boolean;
  theme: ArcadeTheme;
  onToggleSound: () => void;
  onToggleCrt: () => void;
  onToggleTheme: () => void;
  onBack: () => void;
  onCheatCoins?: () => void;
  canExit?: boolean;
  children: React.ReactNode;
}

export const GameShell: React.FC<GameShellProps> = ({
  title,
  instruction,
  balance,
  soundEnabled,
  crtEnabled,
  theme,
  onToggleSound,
  onToggleCrt,
  onToggleTheme,
  onBack,
  onCheatCoins,
  canExit = true,
  children,
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center px-3 sm:px-6 lg:px-10 py-4 sm:py-6">
      <div className="w-full max-w-[1600px] flex flex-col gap-4 flex-1">
        {/* Top Handheld Control Strip */}
        <header className="lcd-panel px-3 sm:px-5 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!canExit}
              onClick={() => {
                soundEngine.click();
                onBack();
              }}
              className="pixel-btn bg-[var(--bg-screen)] px-3 py-2 font-pixel text-xs md:text-sm text-[var(--ink-primary)] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ARCADE</span>
            </button>
            <h1 className="font-pixel text-base sm:text-xl md:text-2xl text-[var(--ink-primary)] tracking-wide whitespace-nowrap">
              {title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <BalanceBadge
              balance={balance}
              onCheat={onCheatCoins ?? (() => {})}
            />
            <DisplayControls
              soundEnabled={soundEnabled}
              crtEnabled={crtEnabled}
              theme={theme}
              onToggleSound={onToggleSound}
              onToggleCrt={onToggleCrt}
              onToggleTheme={onToggleTheme}
              compact
            />
          </div>
        </header>

        {/* Short Everyday Instruction Line */}
        <p className="font-mono-body text-xs sm:text-sm md:text-base text-[var(--ink-muted)] px-1 max-w-[65ch]">
          {instruction}
        </p>

        {/* Dedicated Playfield */}
        <div className="lcd-screen p-3 sm:p-5 lg:p-8 flex-1 flex flex-col justify-center">
          {children}
        </div>
      </div>
    </div>
  );
};
