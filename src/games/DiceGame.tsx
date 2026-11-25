import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { BetBar } from '../components/BetBar';
import { GameShell } from '../components/GameShell';
import { validateBet } from '../engine/economy';
import type { RoundSettlementInput } from '../engine/economy';
import {
  calculateDiceMultiplier,
  calculateDiceWinChance,
  calculatePayout,
  evaluateDiceRoll,
  rollDiceValue,
  type DiceMode,
} from '../engine/gamesMath';
import type { ArcadeTheme } from '../engine/types';

interface DiceGameProps {
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

export const DiceGame: React.FC<DiceGameProps> = ({
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
  const [target, setTarget] = useState(50);
  const [mode, setMode] = useState<DiceMode>('OVER');
  const [rolling, setRolling] = useState(false);
  const [displayRoll, setDisplayRoll] = useState<number>(50);
  const [lastOutcome, setLastOutcome] = useState<{
    roll: number;
    won: boolean;
    payout: number;
    bet: number;
    mult: number;
  } | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const winChance = calculateDiceWinChance(target, mode);
  const multiplier = calculateDiceMultiplier(target, mode);

  const handleRoll = () => {
    if (rolling) return;
    if (!validateBet(bet, balance).valid) return;
    if (!onPlaceBet(bet)) return;

    soundEngine.click();
    setRolling(true);
    setLastOutcome(null);

    const activeBet = bet;
    const activeTarget = target;
    const activeMode = mode;
    const activeMult = multiplier;
    const finalRoll = rollDiceValue();

    let step = 0;
    const iv = window.setInterval(() => {
      step++;
      soundEngine.diceTick();
      setDisplayRoll(Math.floor(Math.random() * 100) + 1);
      if (step >= 8) {
        window.clearInterval(iv);
        timerRef.current = null;
        const won = evaluateDiceRoll(finalRoll, activeTarget, activeMode);
        const payout = won ? calculatePayout(activeBet, activeMult) : 0;

        setDisplayRoll(finalRoll);
        setRolling(false);
        setLastOutcome({
          roll: finalRoll,
          won,
          payout,
          bet: activeBet,
          mult: activeMult,
        });

        if (won) {
          if (activeMult >= 10) soundEngine.jackpot();
          else soundEngine.win();
        } else {
          soundEngine.lose();
        }

        onCompleteRound({
          gameId: 'dice',
          gameName: 'DICE',
          bet: activeBet,
          payout,
          multiplier: won ? activeMult : 0,
          isJackpot: won && activeMult >= 10,
          note: `Rolled ${finalRoll} (${activeMode} ${activeTarget})`,
        });
      }
    }, 65);
    timerRef.current = iv;
  };

  return (
    <GameShell
      title="DICE"
      instruction="Pick a number. Guess if the roll will be higher or lower."
      balance={balance}
      soundEnabled={soundEnabled}
      crtEnabled={crtEnabled}
      theme={theme}
      onToggleSound={onToggleSound}
      onToggleCrt={onToggleCrt}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
      onCheatCoins={onCheatCoins}
      canExit={!rolling}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-8 items-center">
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4">
          <BetBar
            bet={bet}
            balance={balance}
            disabled={rolling}
            onChangeBet={setBet}
            onClaimBailout={onClaimBailout}
          />

          <div className="lcd-panel p-3 sm:p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={rolling}
                onClick={() => {
                  soundEngine.click();
                  setMode('UNDER');
                }}
                className={`pixel-btn py-2.5 font-pixel text-xs md:text-sm ${
                  mode === 'UNDER'
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'bg-[var(--bg-screen)] text-[var(--ink-primary)]'
                }`}
              >
                ROLL UNDER
              </button>
              <button
                type="button"
                disabled={rolling}
                onClick={() => {
                  soundEngine.click();
                  setMode('OVER');
                }}
                className={`pixel-btn py-2.5 font-pixel text-xs md:text-sm ${
                  mode === 'OVER'
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'bg-[var(--bg-screen)] text-[var(--ink-primary)]'
                }`}
              >
                ROLL OVER
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label
                htmlFor="dice-target-slider"
                className="font-pixel text-xs text-[var(--ink-muted)]"
              >
                TARGET NUMBER
              </label>
              <span className="font-pixel text-base text-[var(--ink-primary)] tabular-nums">
                {target}
              </span>
            </div>
            <input
              id="dice-target-slider"
              type="range"
              min={5}
              max={95}
              value={target}
              disabled={rolling}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono-body">
              <div className="bg-[var(--bg-screen)] border border-[var(--border-lcd)] p-2.5">
                <div className="text-[var(--ink-muted)]">WIN CHANCE</div>
                <div className="font-pixel text-sm md:text-base text-[var(--ink-primary)] tabular-nums mt-0.5">
                  {winChance}%
                </div>
              </div>
              <div className="bg-[var(--bg-screen)] border border-[var(--border-lcd)] p-2.5">
                <div className="text-[var(--ink-muted)]">MULTIPLIER</div>
                <div className="font-pixel text-sm md:text-base text-[var(--accent)] tabular-nums mt-0.5">
                  {multiplier.toFixed(2)}X
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={rolling || !validateBet(bet, balance).valid}
            onClick={handleRoll}
            className="pixel-btn-primary w-full py-3.5 md:py-4 font-pixel text-sm md:text-base tracking-wide"
          >
            {rolling ? 'ROLLING...' : 'ROLL DICE'}
          </button>
        </div>

        <div className="md:col-span-7 lg:col-span-8 flex flex-col items-center gap-5">
          <div className="lcd-panel p-6 md:p-8 w-full max-w-md md:max-w-2xl flex flex-col items-center gap-6">
            <div className="w-36 h-36 md:w-48 md:h-48 bg-[var(--bg-casing)] border-4 border-[var(--border-bright)] flex flex-col items-center justify-center">
              <span className="font-pixel text-[10px] md:text-xs text-[var(--ink-muted)]">
                RESULT (1-100)
              </span>
              <span
                className={`font-pixel text-5xl md:text-6xl tabular-nums mt-1 ${
                  rolling ? 'text-[var(--ink-muted)]' : 'text-[var(--accent)]'
                }`}
              >
                {String(displayRoll).padStart(2, '0')}
              </span>
            </div>

            <div className="w-full flex flex-col gap-1.5">
              <div className="relative h-6 md:h-8 bg-[var(--bg-casing)] border-2 border-[var(--border-lcd)] overflow-hidden">
                {mode === 'UNDER' ? (
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--border-lcd)]"
                    style={{ width: `${target}%` }}
                  />
                ) : (
                  <div
                    className="absolute inset-y-0 right-0 bg-[var(--border-lcd)]"
                    style={{ width: `${100 - target}%` }}
                  />
                )}
                <div
                  className="absolute inset-y-0 w-1 bg-[var(--ink-primary)]"
                  style={{ left: `${target}%` }}
                />
                {lastOutcome && (
                  <div
                    className="absolute top-0.5 bottom-0.5 w-2.5 bg-[var(--accent)] border border-[var(--bg-casing)]"
                    style={{ left: `calc(${lastOutcome.roll}% - 5px)` }}
                  />
                )}
              </div>
              <div className="flex justify-between font-pixel text-[10px] md:text-xs text-[var(--ink-muted)] tabular-nums">
                <span>1</span>
                <span>
                  NEED {mode} {target}
                </span>
                <span>100</span>
              </div>
            </div>

            {lastOutcome && (
              <div
                role="status"
                className={`w-full border-2 p-3 md:p-4 font-pixel text-xs sm:text-sm md:text-base flex items-center justify-between ${
                  lastOutcome.won
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-casing)] text-[var(--ink-primary)] border-[var(--border-bright)]'
                }`}
              >
                <span>
                  {lastOutcome.won
                    ? `WIN · ROLLED ${lastOutcome.roll}`
                    : `LOST · ROLLED ${lastOutcome.roll}`}
                </span>
                <span className="tabular-nums">
                  {lastOutcome.won
                    ? `+${lastOutcome.payout.toLocaleString()} ZC`
                    : `-${lastOutcome.bet.toLocaleString()} ZC`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </GameShell>
  );
};
