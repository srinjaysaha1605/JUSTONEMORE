import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { BetBar } from '../components/BetBar';
import { GameShell } from '../components/GameShell';
import { validateBet } from '../engine/economy';
import type { RoundSettlementInput } from '../engine/economy';
import {
  calculatePayout,
  crashMultiplierAtElapsed,
  generateCrashPoint,
} from '../engine/gamesMath';
import { getThemePalette } from '../engine/theme';
import type { ArcadeTheme } from '../engine/types';

interface CrashGameProps {
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

type CrashPhase = 'IDLE' | 'FLYING' | 'CASHED' | 'CRASHED';

const CANVAS_W = 480;
const CANVAS_H = 300;

export const CrashGame: React.FC<CrashGameProps> = ({
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
  const [phase, setPhase] = useState<CrashPhase>('IDLE');
  const [displayMult, setDisplayMult] = useState(1.0);
  const [activeBet, setActiveBet] = useState(0);
  const [resultBanner, setResultBanner] = useState<{
    won: boolean;
    mult: number;
    payout: number;
    crashAt: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef<ArcadeTheme>(theme);
  themeRef.current = theme;

  const simRef = useRef<{
    phase: CrashPhase;
    startTime: number;
    crashPoint: number;
    bet: number;
    cashedAt: number | null;
    elapsedMs: number;
  }>({
    phase: 'IDLE',
    startTime: 0,
    crashPoint: 1.0,
    bet: 0,
    cashedAt: null,
    elapsedMs: 0,
  });

  const onCompleteRef = useRef(onCompleteRound);
  onCompleteRef.current = onCompleteRound;

  const starsRef = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      x: ((i * 73) % (CANVAS_W - 20)) + 10,
      y: ((i * 47) % (CANVAS_H - 20)) + 10,
      size: i % 3 === 0 ? 3 : 2,
    }))
  );

  useEffect(() => {
    let rafId = 0;

    const drawScene = (now: number) => {
      const sim = simRef.current;
      const pal = getThemePalette(themeRef.current);

      if (sim.phase === 'FLYING') {
        sim.elapsedMs = now - sim.startTime;
        const mult = crashMultiplierAtElapsed(sim.elapsedMs);
        if (mult >= sim.crashPoint) {
          sim.phase = 'CRASHED';
          setPhase('CRASHED');
          setDisplayMult(sim.crashPoint);
          soundEngine.explosion();
          setResultBanner({
            won: false,
            mult: sim.crashPoint,
            payout: 0,
            crashAt: sim.crashPoint,
          });
          onCompleteRef.current({
            gameId: 'crash',
            gameName: 'CRASH',
            bet: sim.bet,
            payout: 0,
            multiplier: 0,
            note: `Crashed at ${sim.crashPoint.toFixed(2)}x`,
          });
        } else {
          setDisplayMult(mult);
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = pal.canvasBg;
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

          ctx.strokeStyle = pal.gridLine;
          ctx.lineWidth = 1;
          for (let y = 40; y < CANVAS_H; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_W, y);
            ctx.stroke();
          }

          const starOffset =
            sim.phase === 'FLYING' ? (sim.elapsedMs * 0.04) % CANVAS_W : 0;
          ctx.fillStyle = pal.borderLcd;
          for (const st of starsRef.current) {
            const sx = (st.x - starOffset + CANVAS_W) % CANVAS_W;
            ctx.fillRect(Math.round(sx), st.y, st.size, st.size);
          }

          const progress = Math.min(1, sim.elapsedMs / 10000);
          const rocketX = 48 + progress * (CANVAS_W - 110);
          const rocketY =
            CANVAS_H - 36 - Math.pow(progress, 0.82) * (CANVAS_H - 96);

          if (sim.phase !== 'IDLE') {
            ctx.strokeStyle =
              sim.phase === 'CRASHED' ? pal.borderBright : pal.accent;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(32, CANVAS_H - 28);
            const steps = 20;
            for (let i = 1; i <= steps; i++) {
              const t = i / steps;
              const px = 32 + (rocketX - 32) * t;
              const py =
                CANVAS_H - 28 - Math.pow(t, 1.3) * (CANVAS_H - 28 - rocketY);
              ctx.lineTo(px, py);
            }
            ctx.stroke();
          }

          const rx = sim.phase === 'IDLE' ? 48 : Math.round(rocketX);
          const ry = sim.phase === 'IDLE' ? CANVAS_H - 42 : Math.round(rocketY);

          if (sim.phase === 'CRASHED') {
            ctx.fillStyle = pal.inkPrimary;
            const offsets = [
              [-14, -10],
              [12, -14],
              [-16, 10],
              [14, 12],
              [0, -18],
              [0, 16],
            ];
            for (const [ox, oy] of offsets) {
              ctx.fillRect(rx + ox - 3, ry + oy - 3, 6, 6);
            }
          } else {
            ctx.fillStyle = pal.inkPrimary;
            ctx.fillRect(rx - 8, ry - 6, 16, 10);
            ctx.fillStyle = pal.accent;
            ctx.fillRect(rx + 8, ry - 4, 6, 6);
            ctx.fillRect(rx - 12, ry - 10, 6, 4);
            ctx.fillRect(rx - 12, ry + 4, 6, 4);
            if (sim.phase === 'FLYING' && Math.floor(now / 70) % 2 === 0) {
              ctx.fillStyle = pal.accentMid;
              ctx.fillRect(rx - 18, ry - 3, 8, 4);
            }
          }
        }
      }

      rafId = window.requestAnimationFrame(drawScene);
    };

    rafId = window.requestAnimationFrame(drawScene);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const handleLaunch = () => {
    if (phase === 'FLYING') return;
    if (!validateBet(bet, balance).valid) return;
    if (!onPlaceBet(bet)) return;

    soundEngine.click();
    const crashPt = generateCrashPoint();
    simRef.current = {
      phase: 'FLYING',
      startTime: performance.now(),
      crashPoint: crashPt,
      bet,
      cashedAt: null,
      elapsedMs: 0,
    };
    setActiveBet(bet);
    setDisplayMult(1.0);
    setResultBanner(null);
    setPhase('FLYING');
  };

  const handleCashOut = () => {
    const sim = simRef.current;
    if (sim.phase !== 'FLYING') return;

    const currentMult = crashMultiplierAtElapsed(
      performance.now() - sim.startTime
    );
    if (currentMult >= sim.crashPoint) return;

    sim.phase = 'CASHED';
    sim.cashedAt = currentMult;
    setPhase('CASHED');
    setDisplayMult(currentMult);

    const payout = calculatePayout(sim.bet, currentMult);
    if (currentMult >= 10) soundEngine.jackpot();
    else soundEngine.win();

    setResultBanner({
      won: true,
      mult: currentMult,
      payout,
      crashAt: sim.crashPoint,
    });

    onCompleteRound({
      gameId: 'crash',
      gameName: 'CRASH',
      bet: sim.bet,
      payout,
      multiplier: currentMult,
      isJackpot: currentMult >= 10,
      note: `Cashed out at ${currentMult.toFixed(2)}x`,
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && simRef.current.phase === 'FLYING') {
        e.preventDefault();
        handleCashOut();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <GameShell
      title="CRASH"
      instruction="Watch the multiplier grow. Collect before it crashes."
      balance={balance}
      soundEnabled={soundEnabled}
      crtEnabled={crtEnabled}
      theme={theme}
      onToggleSound={onToggleSound}
      onToggleCrt={onToggleCrt}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
      onCheatCoins={onCheatCoins}
      canExit={phase !== 'FLYING'}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-8 items-center">
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4">
          <BetBar
            bet={bet}
            balance={balance}
            disabled={phase === 'FLYING'}
            onChangeBet={setBet}
            onClaimBailout={onClaimBailout}
          />

          {phase === 'FLYING' ? (
            <button
              type="button"
              onClick={handleCashOut}
              className="pixel-btn-primary w-full py-4 font-pixel text-sm sm:text-base tracking-wide tabular-nums"
            >
              CASH OUT {calculatePayout(activeBet, displayMult).toLocaleString()} ZC
            </button>
          ) : (
            <button
              type="button"
              disabled={!validateBet(bet, balance).valid}
              onClick={handleLaunch}
              className="pixel-btn-primary w-full py-4 font-pixel text-sm md:text-base tracking-wide"
            >
              LAUNCH ROCKET
            </button>
          )}

          {resultBanner && (
            <div
              role="status"
              className={`border-2 p-3 font-pixel text-xs sm:text-sm flex items-center justify-between ${
                resultBanner.won
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--ink-primary)]'
                  : 'bg-[var(--bg-casing)] text-[var(--ink-primary)] border-[var(--border-bright)]'
              }`}
            >
              <span>
                {resultBanner.won
                  ? `COLLECTED @ ${resultBanner.mult.toFixed(2)}X`
                  : `CRASHED @ ${resultBanner.crashAt.toFixed(2)}X`}
              </span>
              <span className="tabular-nums">
                {resultBanner.won
                  ? `+${resultBanner.payout.toLocaleString()} ZC`
                  : `-${activeBet.toLocaleString()} ZC`}
              </span>
            </div>
          )}
        </div>

        <div className="md:col-span-7 lg:col-span-8 flex flex-col items-center">
          <div className="relative w-full max-w-[480px] md:max-w-[780px]">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              data-testid="crash-canvas"
              className="w-full border-2 border-[var(--border-lcd)] bg-[var(--bg-canvas)]"
            />
            <div className="pointer-events-none absolute top-4 left-4 md:top-6 md:left-6">
              <div className="font-pixel text-[10px] md:text-xs text-[var(--ink-muted)]">
                MULTIPLIER
              </div>
              <div
                className={`font-pixel text-3xl sm:text-4xl md:text-5xl tabular-nums ${
                  phase === 'CRASHED'
                    ? 'text-[var(--ink-muted)]'
                    : 'text-[var(--accent)]'
                }`}
              >
                {displayMult.toFixed(2)}X
              </div>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
};
