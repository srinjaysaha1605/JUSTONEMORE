import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { BetBar } from '../components/BetBar';
import { GameShell } from '../components/GameShell';
import { SlotSymbolPixel } from '../components/PixelIcons';
import { validateBet } from '../engine/economy';
import type { RoundSettlementInput } from '../engine/economy';
import {
  SLOT_PAYTABLE,
  calculatePayout,
  evaluateSlotsSpin,
  pickSlotSymbol,
  type SlotSymbol,
} from '../engine/gamesMath';
import type { ArcadeTheme } from '../engine/types';

interface SlotsGameProps {
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

const DISPLAY_CYCLE: SlotSymbol[] = ['CHERRY', 'COIN', 'STAR', 'SEVEN', 'SKULL'];

export const SlotsGame: React.FC<SlotsGameProps> = ({
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
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<[SlotSymbol, SlotSymbol, SlotSymbol]>([
    'SEVEN',
    'SEVEN',
    'SEVEN',
  ]);
  const [reelStopped, setReelStopped] = useState<[boolean, boolean, boolean]>([
    true,
    true,
    true,
  ]);
  const [result, setResult] = useState<{
    label: string;
    multiplier: number;
    payout: number;
    bet: number;
  } | null>(null);

  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current.forEach((id) => window.clearInterval(id));
    };
  }, []);

  const handleSpin = () => {
    if (spinning) return;
    if (!validateBet(bet, balance).valid) return;
    if (!onPlaceBet(bet)) return;

    soundEngine.click();
    setSpinning(true);
    setResult(null);
    setReelStopped([false, false, false]);

    const targets: [SlotSymbol, SlotSymbol, SlotSymbol] = [
      pickSlotSymbol(),
      pickSlotSymbol(),
      pickSlotSymbol(),
    ];
    const currentBet = bet;

    let tick = 0;
    const reelStoppedRef = [false, false, false];
    const cycleInterval = window.setInterval(() => {
      tick++;
      soundEngine.slotSpinStep();
      setReels((prev) => [
        reelStoppedRef[0] ? prev[0] : DISPLAY_CYCLE[tick % DISPLAY_CYCLE.length],
        reelStoppedRef[1] ? prev[1] : DISPLAY_CYCLE[(tick + 2) % DISPLAY_CYCLE.length],
        reelStoppedRef[2] ? prev[2] : DISPLAY_CYCLE[(tick + 4) % DISPLAY_CYCLE.length],
      ]);
    }, 85);

    timersRef.current = [cycleInterval];

    [600, 1000, 1400].forEach((delay, idx) => {
      const t = window.setTimeout(() => {
        reelStoppedRef[idx] = true;
        soundEngine.slotStop(idx);
        setReelStopped((prev) => {
          const next: [boolean, boolean, boolean] = [...prev] as [
            boolean,
            boolean,
            boolean
          ];
          next[idx] = true;
          return next;
        });
        setReels((prev) => {
          const next: [SlotSymbol, SlotSymbol, SlotSymbol] = [...prev] as [
            SlotSymbol,
            SlotSymbol,
            SlotSymbol
          ];
          next[idx] = targets[idx];
          return next;
        });

        if (idx === 2) {
          window.clearInterval(cycleInterval);
          const evalRes = evaluateSlotsSpin(targets);
          const payout = calculatePayout(currentBet, evalRes.multiplier);
          setSpinning(false);
          setResult({
            label: evalRes.label,
            multiplier: evalRes.multiplier,
            payout,
            bet: currentBet,
          });

          if (evalRes.isJackpot) soundEngine.jackpot();
          else if (payout > 0) soundEngine.win();
          else soundEngine.lose();

          onCompleteRound({
            gameId: 'slots',
            gameName: 'PIXEL SLOTS',
            bet: currentBet,
            payout,
            multiplier: evalRes.multiplier,
            isJackpot: evalRes.isJackpot,
            note: `${targets.join('-')} (${evalRes.label})`,
          });
        }
      }, delay);
      timersRef.current.push(t);
    });
  };

  return (
    <GameShell
      title="PIXEL SLOTS"
      instruction="Spin the reels. Match symbols to win coins."
      balance={balance}
      soundEnabled={soundEnabled}
      crtEnabled={crtEnabled}
      theme={theme}
      onToggleSound={onToggleSound}
      onToggleCrt={onToggleCrt}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
      onCheatCoins={onCheatCoins}
      canExit={!spinning}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-8 items-center">
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4">
          <BetBar
            bet={bet}
            balance={balance}
            disabled={spinning}
            onChangeBet={setBet}
            onClaimBailout={onClaimBailout}
          />

          <button
            type="button"
            disabled={spinning || !validateBet(bet, balance).valid}
            onClick={handleSpin}
            className="pixel-btn-primary w-full py-3.5 md:py-4 font-pixel text-sm md:text-base tracking-wide"
          >
            {spinning ? 'SPINNING...' : 'SPIN REELS'}
          </button>

          <div className="lcd-panel p-3 sm:p-4">
            <h2 className="font-pixel text-xs text-[var(--ink-muted)] mb-2">
              PAYOUT TABLE
            </h2>
            <ul className="flex flex-col gap-1.5 text-xs md:text-sm font-mono-body">
              {SLOT_PAYTABLE.map((row) => (
                <li
                  key={row.combo}
                  className="flex items-center justify-between border-b border-[var(--border-lcd)]/40 pb-1 last:border-b-0 last:pb-0"
                >
                  <span className="text-[var(--ink-primary)]">{row.combo}</span>
                  <span className="font-pixel text-[var(--accent)] tabular-nums">
                    {row.multiplier}X
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="md:col-span-7 lg:col-span-8 flex flex-col items-center gap-4">
          <div className="lcd-panel p-4 sm:p-6 lg:p-8 w-full max-w-md md:max-w-2xl flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3 sm:gap-4 bg-[var(--bg-casing)] border-2 border-[var(--border-lcd)] p-3 sm:p-5">
              {reels.map((sym, idx) => (
                <div
                  key={idx}
                  className={`h-28 sm:h-32 md:h-44 lg:h-52 bg-[var(--bg-screen)] border-2 flex flex-col items-center justify-center gap-2 transition-colors ${
                    reelStopped[idx]
                      ? 'border-[var(--border-bright)]'
                      : 'border-[var(--accent)]'
                  }`}
                >
                  <div className={reelStopped[idx] ? '' : 'animate-pulse'}>
                    <SlotSymbolPixel
                      symbol={sym}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20"
                    />
                  </div>
                  <span className="font-pixel text-[10px] md:text-xs text-[var(--ink-muted)]">
                    {sym}
                  </span>
                </div>
              ))}
            </div>

            {result ? (
              <div
                role="status"
                className={`border-2 p-3 md:p-4 font-pixel text-xs sm:text-sm md:text-base flex items-center justify-between ${
                  result.payout > 0
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--ink-primary)]'
                    : 'bg-[var(--bg-casing)] text-[var(--ink-primary)] border-[var(--border-bright)]'
                }`}
              >
                <span>
                  {result.label} ({result.multiplier}X)
                </span>
                <span className="tabular-nums">
                  {result.payout > 0
                    ? `+${result.payout.toLocaleString()} ZC`
                    : `-${result.bet.toLocaleString()} ZC`}
                </span>
              </div>
            ) : (
              <div className="border-2 border-[var(--border-lcd)] bg-[var(--bg-screen)] p-3 md:p-4 font-pixel text-xs md:text-sm text-center text-[var(--ink-muted)]">
                {spinning ? 'ROLLING REELS...' : 'PULL THE LEVER TO SPIN'}
              </div>
            )}
          </div>
        </div>
      </div>
    </GameShell>
  );
};
