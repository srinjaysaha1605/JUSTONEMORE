import React, { useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { BetBar } from '../components/BetBar';
import { GameShell } from '../components/GameShell';
import { validateBet } from '../engine/economy';
import type { RoundSettlementInput } from '../engine/economy';
import {
  MINES_GRID_SIZE,
  calculateMinesMultiplier,
  calculatePayout,
  generateMinesBoard,
} from '../engine/gamesMath';
import type { ArcadeTheme } from '../engine/types';

interface MinesGameProps {
  balance: number;
  soundEnabled: boolean;
  crtEnabled: boolean;
  theme: ArcadeTheme;
  onToggleSound: () => void;
  onToggleCrt: () => void;
  onToggleTheme: () => void;
  onBack: () => void;
  onPlaceBet: (bet: number) => boolean;
  onCompleteRound: (input: RoundSettlementInput) => void;
  onClaimBailout: () => void;
  onCheatCoins: () => void;
}

type Phase = 'IDLE' | 'PLAYING' | 'LOST' | 'CASHED_OUT';

export const MinesGame: React.FC<MinesGameProps> = ({
  balance,
  soundEnabled,
  crtEnabled,
  theme,
  onToggleSound,
  onToggleCrt,
  onToggleTheme,
  onBack,
  onPlaceBet,
  onCompleteRound,
  onClaimBailout,
  onCheatCoins,
}) => {
  const [bet, setBet] = useState(50);
  const [minesCount, setMinesCount] = useState(5);
  const [phase, setPhase] = useState<Phase>('IDLE');
  const [board, setBoard] = useState<boolean[]>(() =>
    Array(MINES_GRID_SIZE).fill(false)
  );
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    Array(MINES_GRID_SIZE).fill(false)
  );
  const [hitIndex, setHitIndex] = useState<number | null>(null);
  const [activeBet, setActiveBet] = useState(0);
  const [lastResult, setLastResult] = useState<{
    outcome: 'WIN' | 'LOSS';
    payout: number;
    multiplier: number;
  } | null>(null);

  const maxSafe = MINES_GRID_SIZE - minesCount;
  const safeCount =
    phase === 'PLAYING'
      ? revealed.filter((r, i) => r && !board[i]).length
      : 0;
  const currentMult = calculateMinesMultiplier(safeCount, minesCount);
  const nextMult = calculateMinesMultiplier(
    Math.min(maxSafe, safeCount + 1),
    minesCount
  );
  const potentialPayout = calculatePayout(activeBet, currentMult);

  const startRound = () => {
    if (phase === 'PLAYING') return;
    if (!validateBet(bet, balance).valid) return;
    if (!onPlaceBet(bet)) return;

    soundEngine.click();
    setBoard(generateMinesBoard(minesCount));
    setRevealed(Array(MINES_GRID_SIZE).fill(false));
    setHitIndex(null);
    setActiveBet(bet);
    setLastResult(null);
    setPhase('PLAYING');
  };

  const finishWin = (finalSafeCount: number) => {
    const mult = calculateMinesMultiplier(finalSafeCount, minesCount);
    const payout = calculatePayout(activeBet, mult);
    setPhase('CASHED_OUT');
    setRevealed(Array(MINES_GRID_SIZE).fill(true));
    if (mult >= 10) soundEngine.jackpot();
    else soundEngine.win();

    setLastResult({ outcome: 'WIN', payout, multiplier: mult });
    onCompleteRound({
      gameId: 'mines',
      gameName: 'MINES',
      bet: activeBet,
      payout,
      multiplier: mult,
      isJackpot: mult >= 10,
      note: `${finalSafeCount} safe tiles (${minesCount} mines)`,
    });
  };

  const handleTileClick = (index: number) => {
    if (phase !== 'PLAYING') return;
    if (revealed[index]) return;

    const nextRevealed = [...revealed];
    nextRevealed[index] = true;

    if (board[index]) {
      setHitIndex(index);
      setRevealed(Array(MINES_GRID_SIZE).fill(true));
      setPhase('LOST');
      soundEngine.explosion();
      setLastResult({ outcome: 'LOSS', payout: 0, multiplier: 0 });
      onCompleteRound({
        gameId: 'mines',
        gameName: 'MINES',
        bet: activeBet,
        payout: 0,
        multiplier: 0,
        note: `Hit mine on tile #${index + 1}`,
      });
      return;
    }

    const nextSafe = safeCount + 1;
    setRevealed(nextRevealed);
    soundEngine.tileReveal(nextSafe);

    if (nextSafe >= maxSafe) {
      finishWin(nextSafe);
    }
  };

  const handleCashOut = () => {
    if (phase !== 'PLAYING' || safeCount === 0) return;
    finishWin(safeCount);
  };

  return (
    <GameShell
      title="MINES"
      instruction="Open safe tiles. Avoid the bombs. Collect your coins whenever you want."
      balance={balance}
      soundEnabled={soundEnabled}
      crtEnabled={crtEnabled}
      theme={theme}
      onToggleSound={onToggleSound}
      onToggleCrt={onToggleCrt}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
      onCheatCoins={onCheatCoins}
      canExit={phase !== 'PLAYING'}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-8 items-center">
        {/* Left Controls */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4">
          <BetBar
            bet={bet}
            balance={balance}
            disabled={phase === 'PLAYING'}
            onChangeBet={setBet}
            onClaimBailout={onClaimBailout}
          />

          <div className="lcd-panel p-3 sm:p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="mines-count-range"
                className="font-pixel text-xs text-[var(--ink-muted)]"
              >
                MINES COUNT
              </label>
              <span className="font-pixel text-sm text-[var(--ink-primary)] tabular-nums">
                {minesCount}
              </span>
            </div>
            <input
              id="mines-count-range"
              type="range"
              min={1}
              max={24}
              value={minesCount}
              disabled={phase === 'PLAYING'}
              onChange={(e) => setMinesCount(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 3, 5, 10].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={phase === 'PLAYING'}
                  onClick={() => {
                    soundEngine.click();
                    setMinesCount(preset);
                  }}
                  className={`pixel-btn py-1.5 font-pixel text-xs ${
                    minesCount === preset
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'bg-[var(--bg-screen)] text-[var(--ink-primary)]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="lcd-panel p-3 sm:p-4 flex flex-col gap-2">
            <div className="flex justify-between text-xs md:text-sm font-mono-body text-[var(--ink-muted)]">
              <span>CURRENT MULT</span>
              <span className="font-pixel text-[var(--ink-primary)] tabular-nums">
                {phase === 'PLAYING' ? `${currentMult.toFixed(2)}X` : '1.00X'}
              </span>
            </div>
            <div className="flex justify-between text-xs md:text-sm font-mono-body text-[var(--ink-muted)]">
              <span>NEXT SAFE TILE</span>
              <span className="font-pixel text-[var(--accent)] tabular-nums">
                {nextMult.toFixed(2)}X
              </span>
            </div>
          </div>

          {phase === 'PLAYING' ? (
            <button
              type="button"
              disabled={safeCount === 0}
              onClick={handleCashOut}
              className="pixel-btn-primary w-full py-3.5 md:py-4 font-pixel text-sm md:text-base tracking-wide tabular-nums"
            >
              {safeCount === 0
                ? 'PICK A TILE'
                : `CASH OUT ${potentialPayout.toLocaleString()} ZC`}
            </button>
          ) : (
            <button
              type="button"
              disabled={!validateBet(bet, balance).valid}
              onClick={startRound}
              className="pixel-btn-primary w-full py-3.5 md:py-4 font-pixel text-sm md:text-base tracking-wide"
            >
              START ROUND
            </button>
          )}

          {lastResult && (
            <div
              role="status"
              className={`border-2 p-3 font-pixel text-xs sm:text-sm flex items-center justify-between ${
                lastResult.outcome === 'WIN'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--ink-primary)]'
                  : 'bg-[var(--bg-casing)] text-[var(--ink-primary)] border-[var(--border-bright)]'
              }`}
            >
              <span>
                {lastResult.outcome === 'WIN'
                  ? `CASHED OUT (${lastResult.multiplier.toFixed(2)}X)`
                  : 'BOOM — MINE HIT'}
              </span>
              <span className="tabular-nums">
                {lastResult.outcome === 'WIN'
                  ? `+${lastResult.payout.toLocaleString()} ZC`
                  : `-${activeBet.toLocaleString()} ZC`}
              </span>
            </div>
          )}
        </div>

        {/* Right 5x5 Grid */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col items-center justify-center">
          <div className="grid grid-cols-5 gap-2 sm:gap-3 lg:gap-4 w-full max-w-md md:max-w-xl lg:max-w-[600px]">
            {Array.from({ length: MINES_GRID_SIZE }, (_, idx) => {
              const isRev = revealed[idx];
              const isMine = board[idx];
              const isBoom = hitIndex === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={phase !== 'PLAYING' || isRev}
                  onClick={() => handleTileClick(idx)}
                  aria-label={`Tile ${idx + 1}${
                    isRev ? (isMine ? ' mine' : ' safe') : ''
                  }`}
                  className={`aspect-square min-h-[48px] flex items-center justify-center border-2 transition-transform duration-100 ${
                    !isRev
                      ? phase === 'PLAYING'
                        ? 'bg-[var(--bg-surface-hover)] border-[var(--border-bright)] hover:brightness-110 active:scale-95 cursor-pointer shadow-[0_3px_0_var(--shadow-edge)]'
                        : 'bg-[var(--bg-surface)] border-[var(--border-lcd)] opacity-70 cursor-default'
                      : isMine
                      ? isBoom
                        ? 'bg-[var(--ink-primary)] text-[var(--accent-ink)] border-[var(--accent)]'
                        : 'bg-[var(--bg-casing)] text-[var(--ink-muted)] border-[var(--border-lcd)]'
                      : 'bg-[var(--bg-surface)] text-[var(--accent)] border-[var(--accent)]'
                  }`}
                >
                  {!isRev ? (
                    <span className="font-pixel text-xs md:text-base text-[var(--border-bright)]">
                      ?
                    </span>
                  ) : isMine ? (
                    <span className="font-pixel text-xs sm:text-sm md:text-base tracking-tight">
                      {isBoom ? 'BOOM' : 'BOMB'}
                    </span>
                  ) : (
                    <svg
                      viewBox="0 0 12 12"
                      shapeRendering="crispEdges"
                      className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
                      aria-hidden="true"
                    >
                      <rect x="4" y="1" width="4" height="2" style={{ fill: 'var(--ink-primary)' }} />
                      <rect x="2" y="3" width="8" height="4" style={{ fill: 'var(--accent)' }} />
                      <rect x="4" y="7" width="4" height="3" style={{ fill: 'var(--accent-mid)' }} />
                      <rect x="5" y="10" width="2" height="1" style={{ fill: 'var(--border-bright)' }} />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </GameShell>
  );
};
