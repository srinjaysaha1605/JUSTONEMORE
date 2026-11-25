import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { GAMES_CATALOG } from '../engine/economy';
import type { ArcadeTheme, GameId, HistoryEntry } from '../engine/types';
import { BalanceBadge } from './BalanceBadge';
import { DisplayControls } from './DisplayControls';

interface HistoryScreenProps {
  history: HistoryEntry[];
  balance: number;
  soundEnabled: boolean;
  crtEnabled: boolean;
  theme: ArcadeTheme;
  onToggleSound: () => void;
  onToggleCrt: () => void;
  onToggleTheme: () => void;
  onBack: () => void;
  onCheatCoins: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  balance,
  soundEnabled,
  crtEnabled,
  theme,
  onToggleSound,
  onToggleCrt,
  onToggleTheme,
  onBack,
  onCheatCoins,
}) => {
  const [gameFilter, setGameFilter] = useState<'ALL' | GameId>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>(
    'ALL'
  );

  const filtered = history.filter((item) => {
    if (gameFilter !== 'ALL' && item.gameId !== gameFilter) return false;
    if (outcomeFilter !== 'ALL' && item.outcome !== outcomeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-3 sm:px-6 lg:px-10 py-4 sm:py-6">
      <div className="w-full max-w-[1600px] flex flex-col gap-4 flex-1">
        <header className="lcd-panel px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.click();
                onBack();
              }}
              className="pixel-btn bg-[var(--bg-screen)] px-3 py-2 font-pixel text-xs md:text-sm text-[var(--ink-primary)] inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ARCADE</span>
            </button>
            <h1 className="font-pixel text-base sm:text-xl md:text-2xl text-[var(--ink-primary)]">
              GAME HISTORY
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <BalanceBadge balance={balance} onCheat={onCheatCoins} />
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

        <div className="lcd-panel p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor="history-game-filter"
              className="font-pixel text-xs text-[var(--ink-muted)]"
            >
              GAME
            </label>
            <select
              id="history-game-filter"
              value={gameFilter}
              onChange={(e) => {
                soundEngine.click();
                setGameFilter(e.target.value as 'ALL' | GameId);
              }}
              className="bg-[var(--bg-screen)] border-2 border-[var(--border-lcd)] px-2.5 py-1.5 font-pixel text-xs text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="ALL">ALL GAMES</option>
              {GAMES_CATALOG.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            {(['ALL', 'WIN', 'LOSS'] as const).map((out) => (
              <button
                key={out}
                type="button"
                onClick={() => {
                  soundEngine.click();
                  setOutcomeFilter(out);
                }}
                className={`pixel-btn px-3 py-1.5 font-pixel text-xs ${
                  outcomeFilter === out
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'bg-[var(--bg-screen)] text-[var(--ink-primary)]'
                }`}
              >
                {out}
              </button>
            ))}
          </div>
        </div>

        <section className="lcd-screen p-3 sm:p-5 lg:p-6 overflow-x-auto flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center font-mono-body text-sm md:text-base text-[var(--ink-muted)]">
              No matching rounds recorded yet. Play a game to fill the ledger.
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-mono-body text-xs sm:text-sm md:text-base">
              <thead>
                <tr className="border-b-2 border-[var(--border-lcd)] font-pixel text-[11px] md:text-xs text-[var(--ink-muted)]">
                  <th className="py-2 pr-3">GAME</th>
                  <th className="py-2 pr-3">BET</th>
                  <th className="py-2 pr-3">MULT</th>
                  <th className="py-2 pr-3">RESULT</th>
                  <th className="py-2 pr-3">NET</th>
                  <th className="py-2">TIME</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-[var(--border-lcd)]/40 text-[var(--ink-primary)]"
                  >
                    <td className="py-2.5 pr-3 font-pixel text-xs md:text-sm whitespace-nowrap">
                      {entry.gameName}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums whitespace-nowrap">
                      {entry.bet.toLocaleString()} ZC
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums whitespace-nowrap">
                      {entry.multiplier.toFixed(2)}X
                    </td>
                    <td className="py-2.5 pr-3 font-pixel text-xs md:text-sm whitespace-nowrap">
                      <span
                        className={
                          entry.outcome === 'WIN'
                            ? 'text-[var(--accent)]'
                            : 'text-[var(--ink-muted)]'
                        }
                      >
                        {entry.outcome}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 pr-3 font-pixel text-xs md:text-sm tabular-nums whitespace-nowrap ${
                        entry.net >= 0
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--ink-muted)]'
                      }`}
                    >
                      {entry.net >= 0
                        ? `+${entry.net.toLocaleString()}`
                        : entry.net.toLocaleString()}{' '}
                      ZC
                    </td>
                    <td className="py-2.5 text-xs md:text-sm text-[var(--ink-muted)] tabular-nums whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
};
