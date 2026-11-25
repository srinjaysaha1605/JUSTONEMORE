import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { BetBar } from '../components/BetBar';
import { GameShell } from '../components/GameShell';
import { validateBet } from '../engine/economy';
import type { RoundSettlementInput } from '../engine/economy';
import {
  PLINKO_MULTIPLIERS,
  PLINKO_ROWS,
  calculatePayout,
  getPlinkoMultiplierForSlot,
} from '../engine/gamesMath';
import { getThemePalette } from '../engine/theme';
import type { ArcadeTheme } from '../engine/types';

interface PlinkoGameProps {
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

const CANVAS_W = 440;
const CANVAS_H = 400;
const PEG_RADIUS = 5;
const BALL_RADIUS = 7;

interface Peg {
  x: number;
  y: number;
  row: number;
  flash: number;
}

function buildPegs(): Peg[] {
  const pegs: Peg[] = [];
  const startY = 58;
  const endY = 328;
  const rowStep = (endY - startY) / (PLINKO_ROWS - 1);
  const colGap = 34;

  for (let row = 0; row < PLINKO_ROWS; row++) {
    const count = row + 3;
    const totalWidth = (count - 1) * colGap;
    const startX = CANVAS_W / 2 - totalWidth / 2;
    for (let col = 0; col < count; col++) {
      pegs.push({
        x: startX + col * colGap,
        y: startY + row * rowStep,
        row,
        flash: 0,
      });
    }
  }
  return pegs;
}

export const PlinkoGame: React.FC<PlinkoGameProps> = ({
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
  const [dropping, setDropping] = useState(false);
  const [lastSlot, setLastSlot] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{
    multiplier: number;
    payout: number;
    bet: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pegsRef = useRef<Peg[]>(buildPegs());
  const themeRef = useRef<ArcadeTheme>(theme);
  themeRef.current = theme;

  const ballRef = useRef<{
    active: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    bet: number;
    trail: Array<{ x: number; y: number }>;
  }>({
    active: false,
    x: CANVAS_W / 2,
    y: 22,
    vx: 0,
    vy: 0,
    bet: 0,
    trail: [],
  });
  const lastSlotRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onCompleteRound);
  onCompleteRef.current = onCompleteRound;

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const slotCount = PLINKO_MULTIPLIERS.length;
    const boardBottomWidth = (PLINKO_ROWS + 1) * 34;
    const slotsLeft = CANVAS_W / 2 - boardBottomWidth / 2;
    const slotW = boardBottomWidth / slotCount;
    const floorY = 356;

    const renderFrame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      const pegs = pegsRef.current;
      const ball = ballRef.current;
      const pal = getThemePalette(themeRef.current);

      if (ball.active) {
        const subSteps = 3;
        const subDt = dt / subSteps;
        for (let s = 0; s < subSteps; s++) {
          ball.vy += 940 * subDt;
          ball.x += ball.vx * subDt;
          ball.y += ball.vy * subDt;

          const minX = 28;
          const maxX = CANVAS_W - 28;
          if (ball.x < minX) {
            ball.x = minX;
            ball.vx = Math.abs(ball.vx) * 0.65;
          } else if (ball.x > maxX) {
            ball.x = maxX;
            ball.vx = -Math.abs(ball.vx) * 0.65;
          }

          for (const peg of pegs) {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const minDist = BALL_RADIUS + PEG_RADIUS;
            const distSq = dx * dx + dy * dy;
            if (distSq < minDist * minDist && distSq > 0.0001) {
              const dist = Math.sqrt(distSq);
              const nx = dx / dist;
              const ny = dy / dist;
              ball.x = peg.x + nx * (minDist + 0.5);
              ball.y = peg.y + ny * (minDist + 0.5);

              const dot = ball.vx * nx + ball.vy * ny;
              if (dot < 0) {
                const restitution = 0.52;
                ball.vx = (ball.vx - (1 + restitution) * dot * nx) * 0.92;
                ball.vy = (ball.vy - (1 + restitution) * dot * ny) * 0.85;
                if (Math.abs(nx) < 0.08) {
                  ball.vx += (Math.random() < 0.5 ? -1 : 1) * 48;
                } else {
                  ball.vx += (Math.random() - 0.5) * 18;
                }
                peg.flash = 1;
                soundEngine.pegBounce(peg.row);
              }
            }
          }
        }

        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 10) ball.trail.shift();

        if (ball.y >= floorY) {
          ball.active = false;
          const relX = ball.x - slotsLeft;
          const rawSlot = Math.floor(relX / slotW);
          const slotIdx = Math.max(0, Math.min(slotCount - 1, rawSlot));
          const mult = getPlinkoMultiplierForSlot(slotIdx);
          const payout = calculatePayout(ball.bet, mult);

          lastSlotRef.current = slotIdx;
          setLastSlot(slotIdx);
          setDropping(false);
          setLastResult({ multiplier: mult, payout, bet: ball.bet });

          if (mult >= 10) soundEngine.jackpot();
          else if (mult >= 1) soundEngine.win();
          else soundEngine.lose();

          onCompleteRef.current({
            gameId: 'plinko',
            gameName: 'PLINKO',
            bet: ball.bet,
            payout,
            multiplier: mult,
            isJackpot: mult >= 10,
            note: `Landed in slot #${slotIdx + 1} (${mult}x)`,
          });
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
          for (let gx = 0; gx < CANVAS_W; gx += 22) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, CANVAS_H);
            ctx.stroke();
          }

          ctx.fillStyle = pal.borderBright;
          ctx.fillRect(CANVAS_W / 2 - 10, 6, 20, 6);

          for (const peg of pegs) {
            if (peg.flash > 0) peg.flash = Math.max(0, peg.flash - dt * 5);
            ctx.fillStyle = peg.flash > 0.2 ? pal.inkPrimary : pal.borderBright;
            ctx.fillRect(
              Math.round(peg.x - PEG_RADIUS),
              Math.round(peg.y - PEG_RADIUS),
              PEG_RADIUS * 2,
              PEG_RADIUS * 2
            );
          }

          for (let i = 0; i < slotCount; i++) {
            const sx = slotsLeft + i * slotW;
            const mult = PLINKO_MULTIPLIERS[i];
            const isHigh = mult >= 5;
            const isLanded = lastSlotRef.current === i;
            ctx.fillStyle = isLanded
              ? pal.inkPrimary
              : isHigh
              ? pal.accent
              : mult >= 1.2
              ? pal.borderLcd
              : pal.surface;
            ctx.fillRect(sx + 2, floorY, slotW - 4, 34);
            ctx.strokeStyle = isLanded ? pal.accent : pal.borderBright;
            ctx.lineWidth = isLanded ? 2 : 1;
            ctx.strokeRect(sx + 2, floorY, slotW - 4, 34);

            ctx.fillStyle = isLanded || isHigh ? pal.accentInk : pal.inkPrimary;
            ctx.font = 'bold 9px "IBM Plex Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${mult}x`, sx + slotW / 2, floorY + 21);
          }

          if (ball.active) {
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = pal.accent;
            for (const t of ball.trail) {
              ctx.fillRect(Math.round(t.x - 4), Math.round(t.y - 4), 8, 8);
            }
            ctx.globalAlpha = 1;
            ctx.fillStyle = pal.inkPrimary;
            ctx.fillRect(
              Math.round(ball.x - BALL_RADIUS),
              Math.round(ball.y - BALL_RADIUS),
              BALL_RADIUS * 2,
              BALL_RADIUS * 2
            );
            ctx.fillStyle = pal.accent;
            ctx.fillRect(Math.round(ball.x - 3), Math.round(ball.y - 3), 6, 6);
          }
        }
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const handleDrop = () => {
    if (dropping) return;
    if (!validateBet(bet, balance).valid) return;
    if (!onPlaceBet(bet)) return;

    soundEngine.click();
    setLastResult(null);
    lastSlotRef.current = null;
    setLastSlot(null);
    setDropping(true);

    ballRef.current = {
      active: true,
      x: CANVAS_W / 2 + (Math.random() - 0.5) * 14,
      y: 22,
      vx: (Math.random() - 0.5) * 26,
      vy: 30,
      bet,
      trail: [],
    };
  };

  return (
    <GameShell
      title="PLINKO"
      instruction="Drop a ball and see where it lands."
      balance={balance}
      soundEnabled={soundEnabled}
      crtEnabled={crtEnabled}
      theme={theme}
      onToggleSound={onToggleSound}
      onToggleCrt={onToggleCrt}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
      onCheatCoins={onCheatCoins}
      canExit={!dropping}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-8 items-center">
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4">
          <BetBar
            bet={bet}
            balance={balance}
            disabled={dropping}
            onChangeBet={setBet}
            onClaimBailout={onClaimBailout}
          />

          <button
            type="button"
            disabled={dropping || !validateBet(bet, balance).valid}
            onClick={handleDrop}
            className="pixel-btn-primary w-full py-3.5 md:py-4 font-pixel text-sm md:text-base tracking-wide"
          >
            {dropping ? 'BALL DROPPING...' : 'DROP BALL'}
          </button>

          {lastResult && (
            <div
              role="status"
              className={`border-2 p-3 font-pixel text-xs sm:text-sm flex items-center justify-between ${
                lastResult.payout >= lastResult.bet
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--ink-primary)]'
                  : 'bg-[var(--bg-casing)] text-[var(--ink-primary)] border-[var(--border-bright)]'
              }`}
            >
              <span>
                SLOT #{(lastSlot ?? 0) + 1} · {lastResult.multiplier}X
              </span>
              <span className="tabular-nums">
                {lastResult.payout >= lastResult.bet
                  ? `+${(lastResult.payout - lastResult.bet).toLocaleString()} ZC`
                  : `${lastResult.payout - lastResult.bet} ZC`}
              </span>
            </div>
          )}
        </div>

        <div className="md:col-span-7 lg:col-span-8 flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            data-testid="plinko-canvas"
            className="w-full max-w-[440px] md:max-w-[680px] border-2 border-[var(--border-lcd)] bg-[var(--bg-canvas)]"
          />
        </div>
      </div>
    </GameShell>
  );
};
