import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { BetBar } from '../components/BetBar';
import { GameShell } from '../components/GameShell';
import { validateBet, type RoundSettlementInput } from '../engine/economy';
import {
  COINFLIP_MAX_STREAK,
  calculateCoinFlipMultiplier,
  calculatePayout,
  flipCoinSide,
  type CoinSide,
} from '../engine/gamesMath';
import type { ArcadeTheme } from '../engine/types';

interface CoinFlipGameProps {
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

const PixelCoinFace: React.FC<{
  side: CoinSide;
  edgeOn?: boolean;
}> = ({ side, edgeOn = false }) => (
  <svg
    viewBox="0 0 24 24"
    shapeRendering="crispEdges"
    className="w-28 h-28 sm:w-36 sm:h-36 transition-transform duration-75"
    style={{
      transform: edgeOn ? 'scaleX(0.22)' : 'scaleX(1)',
    }}
    aria-hidden="true"
  >
    {/* Coin outer rim */}
    <rect x="7" y="1" width="10" height="2" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="4" y="3" width="16" height="2" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="2" y="5" width="20" height="14" style={{ fill: 'var(--accent-mid)' }} />
    <rect x="4" y="19" width="16" height="2" style={{ fill: 'var(--border-bright)' }} />
    <rect x="7" y="21" width="10" height="2" style={{ fill: 'var(--border-lcd)' }} />

    {/* Inner recessed coin disc */}
    <rect x="6" y="4" width="12" height="16" style={{ fill: 'var(--bg-screen)' }} />
    <rect x="4" y="6" width="16" height="12" style={{ fill: 'var(--bg-screen)' }} />

    {side === 'HEADS' ? (
      <>
        {/* Pixel crown / H crest */}
        <rect x="7" y="7" width="2" height="10" style={{ fill: 'var(--accent)' }} />
        <rect x="15" y="7" width="2" height="10" style={{ fill: 'var(--accent)' }} />
        <rect x="9" y="11" width="6" height="2" style={{ fill: 'var(--ink-primary)' }} />
        <rect x="11" y="7" width="2" height="2" style={{ fill: 'var(--ink-primary)' }} />
      </>
    ) : (
      <>
        {/* Pixel T / star crest */}
        <rect x="7" y="7" width="10" height="2" style={{ fill: 'var(--accent)' }} />
        <rect x="11" y="9" width="2" height="8" style={{ fill: 'var(--ink-primary)' }} />
        <rect x="8" y="14" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
        <rect x="14" y="14" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
      </>
    )}
  </svg>
);

export const CoinFlipGame: React.FC<CoinFlipGameProps> = ({
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
  const [choice, setChoice] = useState<CoinSide>('HEADS');
  const [quickPlay, setQuickPlay] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [streak, setStreak] = useState(0);
  const [displaySide, setDisplaySide] = useState<CoinSide>('HEADS');
  const [edgeOn, setEdgeOn] = useState(false);
  const [liftY, setLiftY] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<{
    won: boolean;
    payout: number;
    bet: number;
    mult: number;
    landed: CoinSide;
    streak: number;
  } | null>(null);

  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const currentMult = calculateCoinFlipMultiplier(streak);
  const nextMult = calculateCoinFlipMultiplier(streak + 1);
  const potentialPayout =
    streak > 0
      ? calculatePayout(activeBet, currentMult)
      : calculatePayout(bet, nextMult);

  const settleWin = (finalStreak: number, betAmount: number, landed: CoinSide) => {
    const mult = calculateCoinFlipMultiplier(finalStreak);
    const payout = calculatePayout(betAmount, mult);
    setStreak(0);
    setLastOutcome({
      won: true,
      payout,
      bet: betAmount,
      mult,
      landed,
      streak: finalStreak,
    });
    if (mult >= 10) soundEngine.jackpot();
    else soundEngine.win();

    onCompleteRound({
      gameId: 'coinflip',
      gameName: 'COIN FLIP',
      bet: betAmount,
      payout,
      multiplier: mult,
      isJackpot: mult >= 10,
      note: `${finalStreak}x ${landed} cashout`,
    });
  };

  const handleFlip = () => {
    if (flipping) return;

    let roundBet = activeBet;
    if (streak === 0) {
      if (!validateBet(bet, balance).valid) return;
      if (!onPlaceBet(bet)) return;
      roundBet = bet;
      setActiveBet(bet);
      setLastOutcome(null);
    }

    setFlipping(true);
    soundEngine.coinFlip();

    const landed = flipCoinSide();
    const chosenSide = choice;
    const prevStreak = streak;

    const finishFlip = () => {
      setEdgeOn(false);
      setLiftY(0);
      setDisplaySide(landed);
      setFlipping(false);

      if (landed === chosenSide) {
        const nextStreak = prevStreak + 1;
        soundEngine.tileReveal(nextStreak);
        if (nextStreak >= COINFLIP_MAX_STREAK) {
          settleWin(nextStreak, roundBet, landed);
        } else {
          setStreak(nextStreak);
        }
      } else {
        setStreak(0);
        setLastOutcome({
          won: false,
          payout: 0,
          bet: roundBet,
          mult: 0,
          landed,
          streak: prevStreak,
        });
        soundEngine.lose();
        onCompleteRound({
          gameId: 'coinflip',
          gameName: 'COIN FLIP',
          bet: roundBet,
          payout: 0,
          multiplier: 0,
          note: `Missed ${chosenSide}, landed ${landed}`,
        });
      }
    };

    if (quickPlay) {
      timersRef.current = [window.setTimeout(finishFlip, 90)];
      return;
    }

    const frames: Array<{ delay: number; side: CoinSide; edge: boolean; y: number }> = [
      { delay: 0, side: chosenSide, edge: true, y: -16 },
      { delay: 80, side: 'TAILS', edge: false, y: -28 },
      { delay: 160, side: 'HEADS', edge: true, y: -32 },
      { delay: 240, side: 'HEADS', edge: false, y: -22 },
      { delay: 320, side: 'TAILS', edge: true, y: -10 },
      { delay: 400, side: landed, edge: false, y: 2 },
    ];

    clearTimers();
    frames.forEach((f) => {
      timersRef.current.push(
        window.setTimeout(() => {
          setDisplaySide(f.side);
          setEdgeOn(f.edge);
          setLiftY(f.y);
        }, f.delay)
      );
    });
    timersRef.current.push(window.setTimeout(finishFlip, 480));
  };

  const handleCashOut = () => {
    if (flipping || streak <= 0) return;
    settleWin(streak, activeBet, displaySide);
  };

  const inProgress = flipping || streak > 0;

  return (
    <GameShell
      title="COIN FLIP"
      instruction="Pick Heads or Tails. Build your streak or cash out."
      balance={balance}
      soundEnabled={soundEnabled}
      crtEnabled={crtEnabled}
      theme={theme}
      onToggleSound={onToggleSound}
      onToggleCrt={onToggleCrt}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
      onCheatCoins={onCheatCoins}
      canExit={!inProgress}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-8 items-center">
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4">
          <BetBar
            bet={bet}
            balance={balance}
            disabled={inProgress}
            onChangeBet={setBet}
            onClaimBailout={onClaimBailout}
          />

          <div className="lcd-panel p-3 sm:p-4 flex flex-col gap-3">
            <div className="font-pixel text-xs text-[var(--ink-muted)]">
              CALL SIDE
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['HEADS', 'TAILS'] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  disabled={flipping}
                  onClick={() => {
                    soundEngine.click();
                    setChoice(side);
                  }}
                  className={`pixel-btn py-2.5 font-pixel text-xs md:text-sm ${
                    choice === side
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'bg-[var(--bg-screen)] text-[var(--ink-primary)]'
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={flipping}
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

            <div className="grid grid-cols-2 gap-2 text-xs font-mono-body pt-1">
              <div className="bg-[var(--bg-screen)] border border-[var(--border-lcd)] p-2.5">
                <div className="text-[var(--ink-muted)]">STREAK</div>
                <div className="font-pixel text-sm md:text-base text-[var(--ink-primary)] tabular-nums mt-0.5">
                  {streak}/{COINFLIP_MAX_STREAK}
                </div>
              </div>
              <div className="bg-[var(--bg-screen)] border border-[var(--border-lcd)] p-2.5">
                <div className="text-[var(--ink-muted)]">
                  {streak > 0 ? 'CURRENT' : 'NEXT MULT'}
                </div>
                <div className="font-pixel text-sm md:text-base text-[var(--accent)] tabular-nums mt-0.5">
                  {(streak > 0 ? currentMult : nextMult).toFixed(2)}X
                </div>
              </div>
            </div>
          </div>

          {streak === 0 ? (
            <button
              type="button"
              disabled={flipping || !validateBet(bet, balance).valid}
              onClick={handleFlip}
              className="pixel-btn-primary w-full py-3.5 md:py-4 font-pixel text-sm md:text-base tracking-wide"
            >
              {flipping ? 'FLIPPING...' : 'FLIP COIN'}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={flipping}
                onClick={handleFlip}
                className="pixel-btn-primary py-3.5 font-pixel text-xs sm:text-sm tracking-wide"
              >
                {flipping ? 'FLIPPING...' : `FLIP (${nextMult.toFixed(2)}X)`}
              </button>
              <button
                type="button"
                disabled={flipping}
                onClick={handleCashOut}
                className="pixel-btn bg-[var(--bg-screen)] py-3.5 font-pixel text-xs sm:text-sm text-[var(--ink-primary)] tabular-nums"
              >
                CASH OUT +{potentialPayout}
              </button>
            </div>
          )}
        </div>

        <div className="md:col-span-7 lg:col-span-8 flex flex-col items-center gap-5">
          <div className="lcd-panel p-6 md:p-8 w-full max-w-md md:max-w-2xl flex flex-col items-center gap-6">
            <div className="w-full flex items-center justify-between font-pixel text-xs text-[var(--ink-muted)]">
              <span>CALL: {choice}</span>
              <span className="tabular-nums">
                NEXT PAYOUT: {calculatePayout(streak > 0 ? activeBet : bet, nextMult).toLocaleString()} ZC
              </span>
            </div>

            <div className="w-44 h-44 sm:w-52 sm:h-52 bg-[var(--bg-casing)] border-4 border-[var(--border-bright)] flex flex-col items-center justify-center relative">
              <div
                className="transition-transform duration-75"
                style={{ transform: `translateY(${liftY}px)` }}
              >
                <PixelCoinFace side={displaySide} edgeOn={edgeOn} />
              </div>
              <span className="mt-2 font-pixel text-xs text-[var(--ink-primary)] tracking-wider">
                {flipping ? 'SPINNING' : displaySide}
              </span>
            </div>

            <div className="w-full grid grid-cols-5 gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5].map((step) => {
                const active = streak >= step;
                const mult = calculateCoinFlipMultiplier(step);
                return (
                  <div
                    key={step}
                    className={`border-2 py-2 px-1 text-center font-pixel text-[10px] sm:text-xs tabular-nums ${
                      active
                        ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--ink-primary)]'
                        : 'bg-[var(--bg-screen)] text-[var(--ink-muted)] border-[var(--border-lcd)]'
                    }`}
                  >
                    <div>#{step}</div>
                    <div>{mult.toFixed(2)}X</div>
                  </div>
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
                    ? `CASHED OUT · ${lastOutcome.streak}X STREAK`
                    : `MISSED · LANDED ${lastOutcome.landed}`}
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
