import React, { useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { BetBar } from '../components/BetBar';
import { GameShell } from '../components/GameShell';
import { validateBet } from '../engine/economy';
import type { RoundSettlementInput } from '../engine/economy';
import {
  TOWER_FLOORS,
  calculatePayout,
  calculateTowerMultiplier,
  generateTowerFloor,
  getTowerConfig,
  type TowerDifficulty,
} from '../engine/gamesMath';
import type { ArcadeTheme } from '../engine/types';

interface TowerGameProps {
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

type TowerPhase = 'IDLE' | 'PLAYING' | 'LOST' | 'CASHED_OUT';

export const TowerGame: React.FC<TowerGameProps> = ({
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
  const [difficulty, setDifficulty] = useState<TowerDifficulty>('NORMAL');
  const [phase, setPhase] = useState<TowerPhase>('IDLE');
  const [floors, setFloors] = useState<boolean[][]>([]);
  const [picks, setPicks] = useState<Array<number | null>>(() =>
    Array(TOWER_FLOORS).fill(null)
  );
  const [activeFloor, setActiveFloor] = useState(0);
  const [activeBet, setActiveBet] = useState(0);
  const [result, setResult] = useState<{
    won: boolean;
    payout: number;
    mult: number;
  } | null>(null);

  const { cols } = getTowerConfig(difficulty);
  const clearedFloors =
    phase === 'PLAYING' ? activeFloor : picks.filter((p) => p !== null).length;
  const displayFloor = phase === 'PLAYING' ? activeFloor : 0;
  const currentMult = calculateTowerMultiplier(displayFloor, difficulty);
  const nextMult = calculateTowerMultiplier(
    Math.min(TOWER_FLOORS, displayFloor + 1),
    difficulty
  );
  const potentialPayout = calculatePayout(activeBet, currentMult);

  const startRound = () => {
    if (phase === 'PLAYING') return;
    if (!validateBet(bet, balance).valid) return;
    if (!onPlaceBet(bet)) return;

    soundEngine.click();
    const generated = Array.from({ length: TOWER_FLOORS }, () =>
      generateTowerFloor(difficulty)
    );
    setFloors(generated);
    setPicks(Array(TOWER_FLOORS).fill(null));
    setActiveFloor(0);
    setActiveBet(bet);
    setResult(null);
    setPhase('PLAYING');
  };

  const finishWin = (floorsCleared: number) => {
    const mult = calculateTowerMultiplier(floorsCleared, difficulty);
    const payout = calculatePayout(activeBet, mult);
    setPhase('CASHED_OUT');
    if (mult >= 10) soundEngine.jackpot();
    else soundEngine.win();

    setResult({ won: true, payout, mult });
    onCompleteRound({
      gameId: 'tower',
      gameName: 'TOWER',
      bet: activeBet,
      payout,
      multiplier: mult,
      isJackpot: mult >= 10,
      note: `Cleared ${floorsCleared}/${TOWER_FLOORS} floors (${difficulty})`,
    });
  };

  const handlePickTile = (floorIdx: number, colIdx: number) => {
    if (phase !== 'PLAYING' || floorIdx !== activeFloor) return;
    const isTrap = floors[floorIdx]?.[colIdx];
    const nextPicks = [...picks];
    nextPicks[floorIdx] = colIdx;
    setPicks(nextPicks);

    if (isTrap) {
      setPhase('LOST');
      soundEngine.explosion();
      setResult({ won: false, payout: 0, mult: 0 });
      onCompleteRound({
        gameId: 'tower',
        gameName: 'TOWER',
        bet: activeBet,
        payout: 0,
        multiplier: 0,
        note: `Trap on floor ${floorIdx + 1} (${difficulty})`,
      });
      return;
    }

    const nextFloor = floorIdx + 1;
    setActiveFloor(nextFloor);
    soundEngine.tileReveal(nextFloor);

    if (nextFloor >= TOWER_FLOORS) {
      finishWin(TOWER_FLOORS);
    }
  };

  const handleCashOut = () => {
    if (phase !== 'PLAYING' || activeFloor === 0) return;
    finishWin(activeFloor);
  };

  const floorIndices = Array.from(
    { length: TOWER_FLOORS },
    (_, i) => TOWER_FLOORS - 1 - i
  );

  return (
    <GameShell
      title="TOWER"
      instruction="Climb higher without hitting a trap."
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
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4">
          <BetBar
            bet={bet}
            balance={balance}
            disabled={phase === 'PLAYING'}
            onChangeBet={setBet}
            onClaimBailout={onClaimBailout}
          />

          <div className="lcd-panel p-3 sm:p-4 flex flex-col gap-2">
            <span className="font-pixel text-xs text-[var(--ink-muted)]">
              DIFFICULTY
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['EASY', 'NORMAL', 'HARD'] as TowerDifficulty[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={phase === 'PLAYING'}
                  onClick={() => {
                    soundEngine.click();
                    setDifficulty(mode);
                  }}
                  className={`pixel-btn py-2 font-pixel text-xs ${
                    difficulty === mode
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'bg-[var(--bg-screen)] text-[var(--ink-primary)]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="lcd-panel p-3 sm:p-4 flex flex-col gap-2 text-xs md:text-sm font-mono-body">
            <div className="flex justify-between text-[var(--ink-muted)]">
              <span>CURRENT MULT</span>
              <span className="font-pixel text-[var(--ink-primary)] tabular-nums">
                {phase === 'PLAYING' ? `${currentMult.toFixed(2)}X` : '1.00X'}
              </span>
            </div>
            <div className="flex justify-between text-[var(--ink-muted)]">
              <span>NEXT FLOOR</span>
              <span className="font-pixel text-[var(--accent)] tabular-nums">
                {displayFloor < TOWER_FLOORS ? `${nextMult.toFixed(2)}X` : 'MAX'}
              </span>
            </div>
          </div>

          {phase === 'PLAYING' ? (
            <button
              type="button"
              disabled={activeFloor === 0}
              onClick={handleCashOut}
              className="pixel-btn-primary w-full py-3.5 md:py-4 font-pixel text-sm md:text-base tracking-wide tabular-nums"
            >
              {activeFloor === 0
                ? 'PICK FLOOR 1'
                : `CASH OUT ${potentialPayout.toLocaleString()} ZC`}
            </button>
          ) : (
            <button
              type="button"
              disabled={!validateBet(bet, balance).valid}
              onClick={startRound}
              className="pixel-btn-primary w-full py-3.5 md:py-4 font-pixel text-sm md:text-base tracking-wide"
            >
              START CLIMB
            </button>
          )}

          {result && (
            <div
              role="status"
              className={`border-2 p-3 font-pixel text-xs sm:text-sm flex items-center justify-between ${
                result.won
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--ink-primary)]'
                  : 'bg-[var(--bg-casing)] text-[var(--ink-primary)] border-[var(--border-bright)]'
              }`}
            >
              <span>
                {result.won
                  ? `CASHED OUT (${result.mult.toFixed(2)}X)`
                  : `TRAP HIT · FLOOR ${Math.max(1, clearedFloors)}`}
              </span>
              <span className="tabular-nums">
                {result.won
                  ? `+${result.payout.toLocaleString()} ZC`
                  : `-${activeBet.toLocaleString()} ZC`}
              </span>
            </div>
          )}
        </div>

        <div className="md:col-span-7 lg:col-span-8 flex flex-col items-center">
          <div className="w-full max-w-md md:max-w-2xl flex flex-col gap-2 md:gap-2.5">
            {floorIndices.map((floorIdx) => {
              const isCurrent = phase === 'PLAYING' && floorIdx === activeFloor;
              const isCleared = floorIdx < activeFloor && phase !== 'IDLE';
              const showAll = phase === 'LOST' || phase === 'CASHED_OUT';
              const floorMult = calculateTowerMultiplier(
                floorIdx + 1,
                difficulty
              );
              const pickedCol = picks[floorIdx];

              return (
                <div
                  key={floorIdx}
                  className={`flex items-center gap-2 md:gap-3 p-1.5 md:p-2 border-2 ${
                    isCurrent
                      ? 'border-[var(--accent)] bg-[var(--bg-surface)]'
                      : 'border-[var(--border-lcd)] bg-[var(--bg-screen)]'
                  }`}
                >
                  <div className="w-16 md:w-24 shrink-0 font-pixel text-[10px] md:text-xs text-[var(--ink-muted)] tabular-nums pl-1">
                    F{floorIdx + 1} · {floorMult.toFixed(2)}X
                  </div>
                  <div
                    className="grid gap-2 md:gap-3 flex-1"
                    style={{
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: cols }, (_, colIdx) => {
                      const isTrap = floors[floorIdx]?.[colIdx];
                      const wasPicked = pickedCol === colIdx;
                      const revealed = showAll || (isCleared && wasPicked);

                      return (
                        <button
                          key={colIdx}
                          type="button"
                          disabled={!isCurrent}
                          onClick={() => handlePickTile(floorIdx, colIdx)}
                          aria-label={`Floor ${floorIdx + 1} Tile ${colIdx + 1}`}
                          className={`h-10 md:h-12 font-pixel text-xs md:text-sm border-2 transition-transform ${
                            !revealed
                              ? isCurrent
                                ? 'bg-[var(--bg-surface-hover)] border-[var(--border-bright)] hover:brightness-110 text-[var(--ink-primary)] cursor-pointer active:scale-95'
                                : 'bg-[var(--bg-canvas)] border-[var(--border-lcd)]/60 text-[var(--border-lcd)]'
                              : isTrap
                              ? wasPicked
                                ? 'bg-[var(--ink-primary)] border-[var(--accent)] text-[var(--accent-ink)]'
                                : 'bg-[var(--bg-casing)] border-[var(--border-lcd)] text-[var(--ink-muted)]'
                              : wasPicked
                              ? 'bg-[var(--accent)] border-[var(--ink-primary)] text-[var(--accent-ink)]'
                              : 'bg-[var(--bg-surface)] border-[var(--border-lcd)] text-[var(--ink-muted)]'
                          }`}
                        >
                          {!revealed
                            ? isCurrent
                              ? 'STEP'
                              : '-'
                            : isTrap
                            ? 'TRAP'
                            : wasPicked
                            ? 'SAFE'
                            : 'OK'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </GameShell>
  );
};
