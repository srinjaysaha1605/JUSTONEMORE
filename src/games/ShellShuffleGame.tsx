import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { BetBar } from '../components/BetBar';
import { GameShell } from '../components/GameShell';
import { SlotSymbolPixel } from '../components/PixelIcons';
import { validateBet, type RoundSettlementInput } from '../engine/economy';
import {
  CUPS_MULTIPLIER,
  calculatePayout,
  generateCupSwaps,
  type CupIndex,
} from '../engine/gamesMath';
import type { ArcadeTheme } from '../engine/types';

interface ShellShuffleGameProps {
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

type CupPhase = 'IDLE' | 'SHOWING' | 'SHUFFLING' | 'PICKING' | 'RESOLVED';

const PixelCupSvg: React.FC<{ raised: boolean }> = ({ raised }) => (
  <svg
    viewBox="0 0 24 24"
    shapeRendering="crispEdges"
    className="w-20 h-20 sm:w-24 sm:h-24 transition-transform duration-150"
    style={{
      transform: raised ? 'translateY(-44px)' : 'translateY(0px)',
    }}
    aria-hidden="true"
  >
    {/* Handle / top knob */}
    <rect x="9" y="2" width="6" height="2" style={{ fill: 'var(--ink-primary)' }} />
    {/* Cup body */}
    <rect x="7" y="4" width="10" height="3" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="6" y="7" width="12" height="5" style={{ fill: 'var(--accent-mid)' }} />
    <rect x="5" y="12" width="14" height="5" style={{ fill: 'var(--border-bright)' }} />
    <rect x="4" y="17" width="16" height="3" style={{ fill: 'var(--border-lcd)' }} />
    {/* Rim lip */}
    <rect x="3" y="20" width="18" height="2" style={{ fill: 'var(--ink-primary)' }} />
    {/* Pixel highlight stripe */}
    <rect x="8" y="6" width="2" height="12" style={{ fill: 'var(--accent)' }} />
  </svg>
);

export const ShellShuffleGame: React.FC<ShellShuffleGameProps> = ({
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
  const [activeBet, setActiveBet] = useState(50);
  const [quickPlay, setQuickPlay] = useState(false);
  const [phase, setPhase] = useState<CupPhase>('IDLE');
  const [slots, setSlots] = useState<[number, number, number]>([0, 1, 2]);
  const [coinCupId, setCoinCupId] = useState<CupIndex>(1);
  const [pickedCupId, setPickedCupId] = useState<number | null>(null);
  const [lastOutcome, setLastOutcome] = useState<{
    won: boolean;
    payout: number;
    bet: number;
    pickedSlot: number;
    coinSlot: number;
  } | null>(null);

  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const startRound = () => {
    if (phase !== 'IDLE' && phase !== 'RESOLVED') return;
    if (!validateBet(bet, balance).valid) return;
    if (!onPlaceBet(bet)) return;

    clearTimers();
    soundEngine.click();

    const roundBet = bet;
    const startCoin = Math.floor(Math.random() * 3) as CupIndex;
    const swaps = generateCupSwaps(quickPlay ? 2 : 5);
    const swapInterval = quickPlay ? 110 : 180;
    const showDuration = quickPlay ? 180 : 520;
    const closeDuration = quickPlay ? 90 : 220;

    setActiveBet(roundBet);
    setSlots([0, 1, 2]);
    setCoinCupId(startCoin);
    setPickedCupId(null);
    setLastOutcome(null);
    setPhase('SHOWING');

    timersRef.current.push(
      window.setTimeout(() => {
        setPhase('SHUFFLING');
      }, showDuration)
    );

    swaps.forEach(([a, b], idx) => {
      timersRef.current.push(
        window.setTimeout(() => {
          soundEngine.cupSlide();
          setSlots((prev) => {
            const next: [number, number, number] = [...prev];
            const tmp = next[a];
            next[a] = next[b];
            next[b] = tmp;
            return next;
          });
        }, showDuration + closeDuration + idx * swapInterval)
      );
    });

    const totalDelay =
      showDuration + closeDuration + swaps.length * swapInterval + 80;
    timersRef.current.push(
      window.setTimeout(() => {
        setPhase('PICKING');
      }, totalDelay)
    );
  };

  const handlePickCup = (cupId: number) => {
    if (phase !== 'PICKING') return;
    setPickedCupId(cupId);
    setPhase('RESOLVED');

    const pickedSlot = slots.indexOf(cupId);
    const coinSlot = slots.indexOf(coinCupId);
    const won = cupId === coinCupId;
    const payout = won ? calculatePayout(activeBet, CUPS_MULTIPLIER) : 0;

    setLastOutcome({
      won,
      payout,
      bet: activeBet,
      pickedSlot,
      coinSlot,
    });

    if (won) soundEngine.win();
    else soundEngine.lose();

    onCompleteRound({
      gameId: 'cups',
      gameName: 'SHELL SHUFFLE',
      bet: activeBet,
      payout,
      multiplier: won ? CUPS_MULTIPLIER : 0,
      note: won
        ? `Found coin under Cup ${pickedSlot + 1}`
        : `Picked Cup ${pickedSlot + 1}, coin at Cup ${coinSlot + 1}`,
    });
  };

  const isBusy = phase === 'SHOWING' || phase === 'SHUFFLING' || phase === 'PICKING';

  const statusText = (() => {
    switch (phase) {
      case 'IDLE':
        return 'PRESS SHUFFLE TO BEGIN';
      case 'SHOWING':
        return 'WATCH THE COIN DROP';
      case 'SHUFFLING':
        return 'FOLLOW THE CUP...';
      case 'PICKING':
        return 'PICK THE WINNING CUP';
      case 'RESOLVED':
        return lastOutcome?.won ? 'NICE TRACKING!' : 'WRONG CUP!';
    }
  })();

  return (
    <GameShell
      title="SHELL SHUFFLE"
      instruction="Watch the coin drop, follow the shuffle, and pick the winning cup."
      balance={balance}
      soundEnabled={soundEnabled}
      crtEnabled={crtEnabled}
      theme={theme}
      onToggleSound={onToggleSound}
      onToggleCrt={onToggleCrt}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
      onCheatCoins={onCheatCoins}
      canExit={!isBusy}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-8 items-center">
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4">
          <BetBar
            bet={bet}
            balance={balance}
            disabled={isBusy}
            onChangeBet={setBet}
            onClaimBailout={onClaimBailout}
          />

          <div className="lcd-panel p-3 sm:p-4 flex flex-col gap-3">
            <button
              type="button"
              disabled={isBusy}
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

            <div className="grid grid-cols-2 gap-2 text-xs font-mono-body">
              <div className="bg-[var(--bg-screen)] border border-[var(--border-lcd)] p-2.5">
                <div className="text-[var(--ink-muted)]">ODDS</div>
                <div className="font-pixel text-sm md:text-base text-[var(--ink-primary)] mt-0.5">
                  1 IN 3
                </div>
              </div>
              <div className="bg-[var(--bg-screen)] border border-[var(--border-lcd)] p-2.5">
                <div className="text-[var(--ink-muted)]">PAYOUT</div>
                <div className="font-pixel text-sm md:text-base text-[var(--accent)] tabular-nums mt-0.5">
                  {CUPS_MULTIPLIER.toFixed(2)}X
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isBusy || !validateBet(bet, balance).valid}
            onClick={startRound}
            className="pixel-btn-primary w-full py-3.5 md:py-4 font-pixel text-sm md:text-base tracking-wide"
          >
            {phase === 'SHUFFLING'
              ? 'SHUFFLING...'
              : phase === 'PICKING'
              ? 'PICK A CUP'
              : 'SHUFFLE CUPS'}
          </button>
        </div>

        <div className="md:col-span-7 lg:col-span-8 flex flex-col items-center gap-5">
          <div className="lcd-panel p-5 sm:p-7 w-full max-w-md md:max-w-2xl flex flex-col items-center gap-5">
            <div className="w-full flex items-center justify-between font-pixel text-xs text-[var(--ink-muted)]">
              <span>{statusText}</span>
              <span className="tabular-nums">
                WIN: {calculatePayout(bet, CUPS_MULTIPLIER).toLocaleString()} ZC
              </span>
            </div>

            <div className="relative w-full h-52 sm:h-60 bg-[var(--bg-casing)] border-4 border-[var(--border-bright)] overflow-hidden">
              {/* Tabletop baseline */}
              <div
                aria-hidden="true"
                className="absolute inset-x-4 bottom-6 h-1 bg-[var(--border-lcd)]"
              />

              {[0, 1, 2].map((cupId) => {
                const slotIdx = slots.indexOf(cupId);
                const hasCoin = cupId === coinCupId;
                const isRaised =
                  (phase === 'SHOWING' && hasCoin) ||
                  (phase === 'RESOLVED' && (hasCoin || pickedCupId === cupId));
                const showCoin =
                  hasCoin && (phase === 'SHOWING' || phase === 'RESOLVED');

                return (
                  <button
                    key={cupId}
                    type="button"
                    disabled={phase !== 'PICKING'}
                    aria-label={`Cup ${slotIdx + 1}`}
                    onClick={() => handlePickCup(cupId)}
                    className={`absolute top-4 bottom-3 w-1/3 flex flex-col items-center justify-end pb-5 transition-transform ${
                      quickPlay ? 'duration-100' : 'duration-150'
                    } ease-out ${
                      phase === 'PICKING'
                        ? 'cursor-pointer hover:brightness-110'
                        : 'cursor-default'
                    }`}
                    style={{
                      left: 0,
                      transform: `translateX(${slotIdx * 100}%)`,
                    }}
                  >
                    <div className="relative flex flex-col items-center justify-end h-36 sm:h-40">
                      {showCoin && (
                        <div className="absolute bottom-1 flex items-center justify-center">
                          <SlotSymbolPixel
                            symbol="COIN"
                            className="w-8 h-8 sm:w-9 sm:h-9"
                            decorative
                          />
                        </div>
                      )}
                      {phase === 'RESOLVED' && !hasCoin && pickedCupId === cupId && (
                        <span className="absolute bottom-2 font-pixel text-[10px] text-[var(--ink-muted)]">
                          EMPTY
                        </span>
                      )}
                      <PixelCupSvg raised={isRaised} />
                    </div>
                    <span
                      className={`mt-1 font-pixel text-[10px] sm:text-xs ${
                        phase === 'PICKING'
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--ink-muted)]'
                      }`}
                    >
                      CUP {slotIdx + 1}
                    </span>
                  </button>
                );
              })}
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
                    ? `WIN · CUP ${lastOutcome.pickedSlot + 1} HAD THE COIN`
                    : `LOST · COIN WAS UNDER CUP ${lastOutcome.coinSlot + 1}`}
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
