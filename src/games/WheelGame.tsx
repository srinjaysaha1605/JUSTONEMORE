import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { BetBar } from '../components/BetBar';
import { GameShell } from '../components/GameShell';
import { validateBet } from '../engine/economy';
import type { RoundSettlementInput } from '../engine/economy';
import {
  WHEEL_SEGMENTS,
  calculatePayout,
  spinWheelIndex,
} from '../engine/gamesMath';
import { getThemePalette } from '../engine/theme';
import type { ArcadeTheme } from '../engine/types';

interface WheelGameProps {
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

const SIZE = 360;

export const WheelGame: React.FC<WheelGameProps> = ({
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
  const [result, setResult] = useState<{
    label: string;
    multiplier: number;
    payout: number;
    bet: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef<ArcadeTheme>(theme);
  themeRef.current = theme;

  const animRef = useRef<{
    active: boolean;
    angle: number;
    startAngle: number;
    targetAngle: number;
    startTime: number;
    duration: number;
    targetIndex: number;
    bet: number;
    lastTickSeg: number;
  }>({
    active: false,
    angle: 0,
    startAngle: 0,
    targetAngle: 0,
    startTime: 0,
    duration: 3000,
    targetIndex: 0,
    bet: 0,
    lastTickSeg: -1,
  });

  const onCompleteRef = useRef(onCompleteRound);
  onCompleteRef.current = onCompleteRound;

  useEffect(() => {
    let rafId = 0;
    const count = WHEEL_SEGMENTS.length;
    const segArc = (Math.PI * 2) / count;

    const draw = (now: number) => {
      const anim = animRef.current;
      const pal = getThemePalette(themeRef.current);

      if (anim.active) {
        const elapsed = now - anim.startTime;
        const t = Math.min(1, elapsed / anim.duration);
        const eased = 1 - Math.pow(1 - t, 3.2);
        anim.angle =
          anim.startAngle + (anim.targetAngle - anim.startAngle) * eased;

        const segIdx =
          Math.floor(
            (((Math.PI * 1.5 - anim.angle) % (Math.PI * 2)) + Math.PI * 2) /
              segArc
          ) % count;
        if (segIdx !== anim.lastTickSeg) {
          anim.lastTickSeg = segIdx;
          soundEngine.wheelTick();
        }

        if (t >= 1) {
          anim.active = false;
          anim.angle = anim.targetAngle % (Math.PI * 2);
          const seg = WHEEL_SEGMENTS[anim.targetIndex];
          const payout = calculatePayout(anim.bet, seg.multiplier);
          setSpinning(false);
          setResult({
            label: seg.label,
            multiplier: seg.multiplier,
            payout,
            bet: anim.bet,
          });

          if (seg.multiplier >= 10) soundEngine.jackpot();
          else if (seg.multiplier >= 1) soundEngine.win();
          else soundEngine.lose();

          onCompleteRef.current({
            gameId: 'wheel',
            gameName: 'LUCKY WHEEL',
            bet: anim.bet,
            payout,
            multiplier: seg.multiplier,
            isJackpot: seg.multiplier >= 10,
            note: `Landed on ${seg.label}`,
          });
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = pal.canvasBg;
          ctx.fillRect(0, 0, SIZE, SIZE);

          const cx = SIZE / 2;
          const cy = SIZE / 2 + 8;
          const r = 148;

          for (let i = 0; i < count; i++) {
            const seg = WHEEL_SEGMENTS[i];
            const start = anim.angle + i * segArc;
            const end = start + segArc;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, start, end);
            ctx.closePath();

            if (seg.tier === 'jackpot') ctx.fillStyle = pal.accent;
            else if (seg.tier === 'high') ctx.fillStyle = pal.accentMid;
            else if (seg.tier === 'mid') ctx.fillStyle = pal.borderLcd;
            else if (seg.tier === 'low') ctx.fillStyle = pal.surfaceHover;
            else ctx.fillStyle = pal.screen;

            ctx.fill();
            ctx.strokeStyle = pal.borderBright;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(start + segArc / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle =
              seg.tier === 'jackpot' || seg.tier === 'high'
                ? pal.accentInk
                : pal.inkPrimary;
            ctx.font = 'bold 11px "IBM Plex Mono", monospace';
            ctx.fillText(seg.label, r - 12, 4);
            ctx.restore();
          }

          ctx.fillStyle = pal.casing;
          ctx.beginPath();
          ctx.arc(cx, cy, 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = pal.inkPrimary;
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = pal.inkPrimary;
          ctx.beginPath();
          ctx.moveTo(cx - 10, 8);
          ctx.lineTo(cx + 10, 8);
          ctx.lineTo(cx, 28);
          ctx.closePath();
          ctx.fill();
        }
      }

      rafId = window.requestAnimationFrame(draw);
    };

    rafId = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const handleSpin = () => {
    if (spinning) return;
    if (!validateBet(bet, balance).valid) return;
    if (!onPlaceBet(bet)) return;

    soundEngine.click();
    setResult(null);
    setSpinning(true);

    const targetIndex = spinWheelIndex();
    const count = WHEEL_SEGMENTS.length;
    const segArc = (Math.PI * 2) / count;
    const desiredMod =
      ((-Math.PI / 2 - (targetIndex + 0.5) * segArc) % (Math.PI * 2) +
        Math.PI * 2) %
      (Math.PI * 2);
    const currentMod =
      ((animRef.current.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let delta = desiredMod - currentMod;
    if (delta < 0) delta += Math.PI * 2;
    const extraSpins = Math.PI * 2 * 5;

    animRef.current = {
      active: true,
      angle: animRef.current.angle,
      startAngle: animRef.current.angle,
      targetAngle: animRef.current.angle + extraSpins + delta,
      startTime: performance.now(),
      duration: 3100,
      targetIndex,
      bet,
      lastTickSeg: -1,
    };
  };

  return (
    <GameShell
      title="LUCKY WHEEL"
      instruction="Spin the wheel and see which multiplier you hit."
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
            {spinning ? 'SPINNING...' : 'SPIN WHEEL'}
          </button>

          {result && (
            <div
              role="status"
              className={`border-2 p-3 font-pixel text-xs sm:text-sm flex items-center justify-between ${
                result.payout >= result.bet
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--ink-primary)]'
                  : 'bg-[var(--bg-casing)] text-[var(--ink-primary)] border-[var(--border-bright)]'
              }`}
            >
              <span>LANDED ON {result.label}</span>
              <span className="tabular-nums">
                {result.payout >= result.bet
                  ? `+${(result.payout - result.bet).toLocaleString()} ZC`
                  : `${result.payout - result.bet} ZC`}
              </span>
            </div>
          )}
        </div>

        <div className="md:col-span-7 lg:col-span-8 flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            data-testid="wheel-canvas"
            className="w-full max-w-[360px] md:max-w-[540px] border-2 border-[var(--border-lcd)] bg-[var(--bg-canvas)]"
          />
        </div>
      </div>
    </GameShell>
  );
};
