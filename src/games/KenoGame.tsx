import React, { useEffect, useMemo, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { BetBar } from '../components/BetBar';
import { GameShell } from '../components/GameShell';
import { validateBet, type RoundSettlementInput } from '../engine/economy';
import {
  KENO_BOARD_SIZE,
  KENO_DRAW_COUNT,
  KENO_MAX_PICKS,
  calculatePayout,
  drawKenoNumbers,
  generateKenoQuickPick,
  getKenoMultiplier,
  getKenoPaytableForPicks,
} from '../engine/gamesMath';
import type { ArcadeTheme } from '../engine/types';

interface KenoGameProps {
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

const BOARD_NUMBERS = Array.from({ length: KENO_BOARD_SIZE }, (_, i) => i + 1);

export const KenoGame: React.FC<KenoGameProps> = ({
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
  const [picks, setPicks] = useState<number[]>([3, 11, 18, 26, 35]);
  const [quickPlay, setQuickPlay] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [revealedDraw, setRevealedDraw] = useState<number[]>([]);
  const [lastOutcome, setLastOutcome] = useState<{
    hits: number;
    picksCount: number;
    mult: number;
    payout: number;
    bet: number;
  } | null>(null);

  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const pickSet = useMemo(() => new Set(picks), [picks]);
  const drawnSet = useMemo(() => new Set(revealedDraw), [revealedDraw]);
  const currentHits = useMemo(
    () => revealedDraw.filter((n) => pickSet.has(n)).length,
    [revealedDraw, pickSet]
  );
  const paytable = useMemo(
    () => getKenoPaytableForPicks(picks.length),
    [picks.length]
  );

  const toggleNumber = (num: number) => {
    if (drawing) return;
    soundEngine.click();
    setLastOutcome(null);
    setRevealedDraw([]);
    setPicks((prev) => {
      if (prev.includes(num)) {
        return prev.filter((n) => n !== num);
      }
      if (prev.length >= KENO_MAX_PICKS) {
        return prev;
      }
      return [...prev, num].sort((a, b) => a - b);
    });
  };

  const handleQuickPick = () => {
    if (drawing) return;
    soundEngine.click();
    setLastOutcome(null);
    setRevealedDraw([]);
    const count = picks.length >= 1 && picks.length <= KENO_MAX_PICKS ? picks.length : 5;
    setPicks(generateKenoQuickPick(count));
  };

  const handleClear = () => {
    if (drawing) return;
    soundEngine.click();
    setLastOutcome(null);
    setRevealedDraw([]);
    setPicks([]);
  };

  const handleDraw = () => {
    if (drawing || picks.length < 1) return;
    if (!validateBet(bet, balance).valid) return;
    if (!onPlaceBet(bet)) return;

    clearTimers();
    soundEngine.click();

    const activeBet = bet;
    const activePicks = [...picks];
    const activePickSet = new Set(activePicks);
    const drawn = drawKenoNumbers(KENO_DRAW_COUNT, KENO_BOARD_SIZE);

    setDrawing(true);
    setRevealedDraw([]);
    setLastOutcome(null);

    const finalize = (finalDraw: number[]) => {
      const hits = finalDraw.filter((n) => activePickSet.has(n)).length;
      const mult = getKenoMultiplier(activePicks.length, hits);
      const payout = calculatePayout(activeBet, mult);
      setDrawing(false);
      setLastOutcome({
        hits,
        picksCount: activePicks.length,
        mult,
        payout,
        bet: activeBet,
      });

      if (payout > 0) {
        if (mult >= 10) soundEngine.jackpot();
        else soundEngine.win();
      } else {
        soundEngine.lose();
      }

      onCompleteRound({
        gameId: 'keno',
        gameName: 'PIXEL KENO',
        bet: activeBet,
        payout,
        multiplier: mult,
        isJackpot: mult >= 10,
        note: `${hits}/${activePicks.length} hits`,
      });
    };

    if (quickPlay) {
      timersRef.current.push(
        window.setTimeout(() => {
          setRevealedDraw(drawn);
          finalize(drawn);
        }, 80)
      );
      return;
    }

    let hitCounter = 0;
    drawn.forEach((num, idx) => {
      timersRef.current.push(
        window.setTimeout(() => {
          const isHit = activePickSet.has(num);
          if (isHit) hitCounter++;
          soundEngine.kenoBlip(isHit, hitCounter);
          setRevealedDraw((prev) => [...prev, num]);
          if (idx === drawn.length - 1) {
            finalize(drawn);
          }
        }, (idx + 1) * 95)
      );
    });
  };

  return (
    <GameShell
      title="PIXEL KENO"
      instruction="Pick 1 to 8 numbers on the board, then draw 10 numbers."
      balance={balance}
      soundEnabled={soundEnabled}
      crtEnabled={crtEnabled}
      theme={theme}
      onToggleSound={onToggleSound}
      onToggleCrt={onToggleCrt}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
      onCheatCoins={onCheatCoins}
      canExit={!drawing}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        <div className="lg:col-span-4 flex flex-col gap-4">
          <BetBar
            bet={bet}
            balance={balance}
            disabled={drawing}
            onChangeBet={setBet}
            onClaimBailout={onClaimBailout}
          />

          <div className="lcd-panel p-3 sm:p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={drawing}
                onClick={handleQuickPick}
                className="pixel-btn bg-[var(--bg-screen)] py-2 font-pixel text-xs text-[var(--ink-primary)]"
              >
                QUICK PICK
              </button>
              <button
                type="button"
                disabled={drawing || picks.length === 0}
                onClick={handleClear}
                className="pixel-btn bg-[var(--bg-screen)] py-2 font-pixel text-xs text-[var(--ink-primary)]"
              >
                CLEAR
              </button>
            </div>

            <button
              type="button"
              disabled={drawing}
              onClick={() => {
                soundEngine.click();
                setQuickPlay((q) => !q);
              }}
              className={`pixel-btn py-2 px-3 font-pixel text-xs flex items-center justify-between ${
                quickPlay
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'bg-[var(--bg-screen)] text-[var(--ink-primary)]'
              }`}
            >
              <span>QUICK PLAY</span>
              <span>{quickPlay ? 'ON' : 'OFF'}</span>
            </button>

            <div className="border-t border-[var(--border-lcd)] pt-2">
              <div className="font-pixel text-[11px] text-[var(--ink-muted)] mb-2">
                PAYOUTS ({picks.length} PICKS)
              </div>
              {paytable.length === 0 ? (
                <div className="font-mono-body text-xs text-[var(--ink-muted)]">
                  Select 1–8 numbers on the board to view multipliers.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 text-xs font-mono-body">
                  {paytable.map((row) => {
                    const matched =
                      revealedDraw.length > 0 && currentHits === row.hits;
                    return (
                      <div
                        key={row.hits}
                        className={`px-2 py-1.5 border flex items-center justify-between tabular-nums ${
                          matched
                            ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--ink-primary)] font-bold'
                            : 'bg-[var(--bg-screen)] text-[var(--ink-primary)] border-[var(--border-lcd)]'
                        }`}
                      >
                        <span>{row.hits} HIT</span>
                        <span className="font-pixel">{row.multiplier}X</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={
              drawing ||
              picks.length < 1 ||
              !validateBet(bet, balance).valid
            }
            onClick={handleDraw}
            className="pixel-btn-primary w-full py-3.5 md:py-4 font-pixel text-sm md:text-base tracking-wide"
          >
            {drawing ? 'DRAWING 10...' : 'DRAW 10'}
          </button>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="lcd-panel p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 font-pixel text-xs text-[var(--ink-muted)] tabular-nums">
              <span>
                PICKS: {picks.length}/{KENO_MAX_PICKS}
              </span>
              <span>
                DRAWN: {revealedDraw.length}/{KENO_DRAW_COUNT} · HITS: {currentHits}
              </span>
            </div>

            <div
              role="group"
              aria-label="Keno number grid"
              className="grid grid-cols-5 sm:grid-cols-8 gap-2"
            >
              {BOARD_NUMBERS.map((num) => {
                const isPicked = pickSet.has(num);
                const isDrawn = drawnSet.has(num);
                const isHit = isPicked && isDrawn;

                let cellStyle =
                  'bg-[var(--bg-screen)] text-[var(--ink-primary)] border-[var(--border-lcd)]';
                let tag = '';
                if (isHit) {
                  cellStyle =
                    'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--ink-primary)] font-bold';
                  tag = 'HIT';
                } else if (isDrawn) {
                  cellStyle =
                    'bg-[var(--bg-casing)] text-[var(--ink-muted)] border-[var(--border-bright)]';
                  tag = '·';
                } else if (isPicked) {
                  cellStyle =
                    'bg-[var(--bg-surface-hover)] text-[var(--ink-primary)] border-[var(--accent)]';
                  tag = '*';
                }

                return (
                  <button
                    key={num}
                    type="button"
                    disabled={drawing}
                    aria-pressed={isPicked}
                    aria-label={`Number ${num}${isHit ? ' hit' : isPicked ? ' selected' : ''}`}
                    onClick={() => toggleNumber(num)}
                    className={`pixel-btn min-h-[44px] py-2 flex flex-col items-center justify-center font-pixel text-xs sm:text-sm tabular-nums ${cellStyle}`}
                  >
                    <span>{String(num).padStart(2, '0')}</span>
                    <span className="text-[9px] leading-none h-2.5 mt-0.5">
                      {tag}
                    </span>
                  </button>
                );
              })}
            </div>

            {lastOutcome && (
              <div
                role="status"
                className={`w-full border-2 p-3 md:p-4 font-pixel text-xs sm:text-sm md:text-base flex items-center justify-between ${
                  lastOutcome.payout >= lastOutcome.bet && lastOutcome.payout > 0
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-casing)] text-[var(--ink-primary)] border-[var(--border-bright)]'
                }`}
              >
                <span>
                  {lastOutcome.payout >= lastOutcome.bet && lastOutcome.payout > 0
                    ? `WIN · ${lastOutcome.hits}/${lastOutcome.picksCount} HITS (${lastOutcome.mult}X)`
                    : lastOutcome.payout > 0
                    ? `PARTIAL · ${lastOutcome.hits}/${lastOutcome.picksCount} HITS (${lastOutcome.mult}X)`
                    : `NO PAYOUT · ${lastOutcome.hits}/${lastOutcome.picksCount} HITS`}
                </span>
                <span className="tabular-nums">
                  {lastOutcome.payout >= lastOutcome.bet && lastOutcome.payout > 0
                    ? `+${lastOutcome.payout.toLocaleString()} ZC`
                    : `${(lastOutcome.payout - lastOutcome.bet).toLocaleString()} ZC`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </GameShell>
  );
};
