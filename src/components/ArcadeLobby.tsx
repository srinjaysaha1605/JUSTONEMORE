import React, { useEffect, useState } from 'react';
import { Award, Gift, History, Settings } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import {
  BAILOUT_AMOUNT,
  DAILY_REWARD_AMOUNT,
  GAMES_CATALOG,
  canClaimBailout,
  canClaimDaily,
  formatDuration,
  getLevelFromXp,
  msUntilDaily,
} from '../engine/economy';
import type { ArcadeState, GameId } from '../engine/types';
import { BalanceBadge } from './BalanceBadge';
import { DisplayControls } from './DisplayControls';
import { GamePixelIcon } from './PixelIcons';
import { ZeroLogo } from './ZeroLogo';

interface ArcadeLobbyProps {
  state: ArcadeState;
  onSelectGame: (id: GameId) => void;
  onOpenHistory: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onToggleCrt: () => void;
  onToggleTheme: () => void;
  onClaimDaily: () => void;
  onClaimBailout: () => void;
  onCheatCoins: () => void;
}

export const ArcadeLobby: React.FC<ArcadeLobbyProps> = ({
  state,
  onSelectGame,
  onOpenHistory,
  onOpenProfile,
  onOpenSettings,
  onToggleSound,
  onToggleCrt,
  onToggleTheme,
  onClaimDaily,
  onClaimBailout,
  onCheatCoins,
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const iv = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(iv);
  }, []);

  const dailyReady = canClaimDaily(state.lastDailyClaim, now);
  const dailyRemaining = msUntilDaily(state.lastDailyClaim, now);
  const needsBailout = canClaimBailout(state.balance);
  const levelInfo = getLevelFromXp(state.stats.xp);

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-3 sm:px-6 lg:px-10 py-4 sm:py-6">
      <div className="w-full max-w-[1600px] flex flex-col gap-4 flex-1">
        {/* Top Handheld Console Header */}
        <header className="lcd-panel px-3 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ZeroLogo size="sm" />
            <span className="font-pixel text-base sm:text-lg md:text-2xl text-[var(--ink-primary)] tracking-wider whitespace-nowrap">
              JUSTONEMORE
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <BalanceBadge
              balance={state.balance}
              onCheat={onCheatCoins}
              accentBorder
            />

            {needsBailout ? (
              <button
                type="button"
                onClick={onClaimBailout}
                className="pixel-btn-primary px-3 py-2 font-pixel text-xs inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>+{BAILOUT_AMOUNT} ZC</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={!dailyReady}
                onClick={onClaimDaily}
                className={`px-3 py-2 font-pixel text-xs inline-flex items-center gap-1.5 whitespace-nowrap ${
                  dailyReady
                    ? 'pixel-btn-primary'
                    : 'pixel-btn bg-[var(--bg-screen)] text-[var(--ink-muted)]'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>
                  {dailyReady
                    ? `DAILY +${DAILY_REWARD_AMOUNT}`
                    : formatDuration(dailyRemaining)}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundEngine.click();
                onOpenProfile();
              }}
              aria-label="Player stats and achievements"
              className="pixel-btn bg-[var(--bg-screen)] px-2.5 py-2 font-pixel text-xs text-[var(--ink-primary)] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Award className="w-3.5 h-3.5" />
              <span>LVL {levelInfo.level}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.click();
                onOpenHistory();
              }}
              aria-label="Game history"
              className="pixel-btn bg-[var(--bg-screen)] p-2 text-[var(--ink-primary)]"
            >
              <History className="w-4 h-4" />
            </button>

            <DisplayControls
              soundEnabled={state.settings.soundEnabled}
              crtEnabled={state.settings.scanlinesEnabled}
              theme={state.settings.theme}
              onToggleSound={onToggleSound}
              onToggleCrt={onToggleCrt}
              onToggleTheme={onToggleTheme}
              compact
            />

            <button
              type="button"
              onClick={() => {
                soundEngine.click();
                onOpenSettings();
              }}
              aria-label="Settings"
              className="pixel-btn bg-[var(--bg-screen)] p-2 text-[var(--ink-primary)]"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Quiet 1-line summary bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs md:text-sm font-mono-body text-[var(--ink-muted)]">
          <span>SELECT A CARTRIDGE TO PLAY · VIRTUAL COINS ONLY</span>
          <span className="tabular-nums">
            PLAYED {state.stats.gamesPlayed} · STREAK {state.stats.currentWinStreak} · WON {state.stats.totalWon.toLocaleString()} ZC
          </span>
        </div>

        {/* Game Selection Screen */}
        <section
          aria-label="Arcade games"
          className="lcd-screen p-3 sm:p-5 lg:p-7 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 flex-1 content-start"
        >
          {GAMES_CATALOG.map((game, index) => {
            const isOddLast =
              GAMES_CATALOG.length % 2 === 1 &&
              index === GAMES_CATALOG.length - 1;
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => {
                  soundEngine.click();
                  onSelectGame(game.id);
                }}
                className={`pixel-btn bg-[var(--bg-surface)] p-4 sm:p-5 lg:p-6 text-left flex items-center justify-between gap-4 group ${
                  isOddLast ? 'md:col-span-2' : ''
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 min-w-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 shrink-0 bg-[var(--bg-screen)] border-2 border-[var(--border-lcd)] flex items-center justify-center group-hover:border-[var(--accent)] transition-colors">
                    <GamePixelIcon
                      gameId={game.id}
                      className="w-8 h-8 sm:w-11 sm:h-11 lg:w-14 lg:h-14"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-pixel text-sm sm:text-lg lg:text-xl text-[var(--ink-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {game.name}
                    </div>
                    <p className="mt-1 font-mono-body text-xs sm:text-sm lg:text-base text-[var(--ink-muted)] max-w-[46ch]">
                      {game.shortDesc}
                    </p>
                  </div>
                </div>

                <span className="pixel-btn-primary px-2.5 sm:px-4 lg:px-5 py-1.5 sm:py-2.5 font-pixel text-[11px] sm:text-xs lg:text-sm whitespace-nowrap shrink-0">
                  PLAY
                </span>
              </button>
            );
          })}
        </section>
      </div>
    </div>
  );
};
