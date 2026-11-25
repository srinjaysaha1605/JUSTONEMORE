import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import {
  PixelDiceCube,
  type SideDicePip,
  type TopDicePip,
} from './ZeroLogo';

interface DiceLoaderProps {
  onComplete: () => void;
  durationMs?: number;
}

interface RollFrame {
  y: number;
  rot: number;
  sx: number;
  sy: number;
  top: TopDicePip;
  left: SideDicePip;
  right: SideDicePip;
  shadowW: number;
  sparkMode: 'none' | 'a' | 'b' | 'impact' | 'glint';
}

const ROLL_FRAMES: RollFrame[] = [
  { y: 6, rot: 0, sx: 1.08, sy: 0.9, top: 5, left: 3, right: 4, shadowW: 18, sparkMode: 'none' },
  { y: -22, rot: -28, sx: 0.96, sy: 1.05, top: 2, left: 6, right: 1, shadowW: 12, sparkMode: 'a' },
  { y: -36, rot: 45, sx: 1.02, sy: 1.02, top: 4, left: 1, right: 6, shadowW: 8, sparkMode: 'b' },
  { y: -30, rot: 135, sx: 1.04, sy: 0.98, top: 1, left: 5, right: 2, shadowW: 8, sparkMode: 'a' },
  { y: -14, rot: 225, sx: 0.98, sy: 1.04, top: 3, left: 2, right: 5, shadowW: 12, sparkMode: 'b' },
  { y: 5, rot: 315, sx: 1.1, sy: 0.88, top: 5, left: 4, right: 3, shadowW: 18, sparkMode: 'impact' },
  { y: -10, rot: 352, sx: 0.98, sy: 1.02, top: 5, left: 3, right: 4, shadowW: 14, sparkMode: 'glint' },
  { y: 0, rot: 360, sx: 1, sy: 1, top: 5, left: 3, right: 4, shadowW: 16, sparkMode: 'glint' },
];

export const DiceLoader: React.FC<DiceLoaderProps> = ({
  onComplete,
  durationMs = 640,
}) => {
  const [frameIdx, setFrameIdx] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setFrameIdx(ROLL_FRAMES.length - 1);
      const t = window.setTimeout(() => onCompleteRef.current(), 220);
      return () => window.clearTimeout(t);
    }

    const stepMs = Math.max(55, Math.floor(durationMs / ROLL_FRAMES.length));
    const timers: number[] = [];

    for (let i = 1; i < ROLL_FRAMES.length; i++) {
      timers.push(
        window.setTimeout(() => {
          setFrameIdx(i);
          if (i === 1 || i === 3 || i === 5) {
            soundEngine.diceTick();
          }
        }, i * stepMs)
      );
    }

    timers.push(window.setTimeout(() => onCompleteRef.current(), durationMs));

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [durationMs]);

  const frame = ROLL_FRAMES[frameIdx] ?? ROLL_FRAMES[ROLL_FRAMES.length - 1];
  const shadowX = Math.floor((32 - frame.shadowW) / 2);

  return (
    <main
      aria-label="Loading"
      aria-busy="true"
      data-testid="dice-loader"
      className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-casing)] select-none overflow-hidden"
    >
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
        {/* Ground pixel shadow & impact dust */}
        <svg
          viewBox="0 0 32 32"
          shapeRendering="crispEdges"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <rect
            x={shadowX}
            y="29"
            width={frame.shadowW}
            height="1"
            style={{ fill: 'var(--border-lcd)' }}
          />
          <rect
            x={shadowX + 2}
            y="28"
            width={Math.max(4, frame.shadowW - 4)}
            height="1"
            style={{ fill: 'var(--bg-surface-hover)' }}
          />

          {frame.sparkMode === 'impact' && (
            <>
              <rect x="3" y="27" width="2" height="1" style={{ fill: 'var(--accent)' }} />
              <rect x="2" y="25" width="1" height="1" style={{ fill: 'var(--ink-primary)' }} />
              <rect x="27" y="27" width="2" height="1" style={{ fill: 'var(--accent)' }} />
              <rect x="29" y="25" width="1" height="1" style={{ fill: 'var(--ink-primary)' }} />
            </>
          )}

          {frame.sparkMode === 'a' && (
            <>
              <rect x="2" y="6" width="2" height="1" style={{ fill: 'var(--accent)' }} />
              <rect x="28" y="20" width="2" height="1" style={{ fill: 'var(--ink-primary)' }} />
              <rect x="5" y="22" width="1" height="2" style={{ fill: 'var(--border-bright)' }} />
            </>
          )}

          {frame.sparkMode === 'b' && (
            <>
              <rect x="27" y="4" width="2" height="1" style={{ fill: 'var(--accent)' }} />
              <rect x="28" y="3" width="1" height="3" style={{ fill: 'var(--accent)' }} />
              <rect x="3" y="16" width="2" height="1" style={{ fill: 'var(--ink-primary)' }} />
              <rect x="26" y="22" width="1" height="1" style={{ fill: 'var(--border-bright)' }} />
            </>
          )}

          {frame.sparkMode === 'glint' && (
            <>
              <rect x="3" y="4" width="1" height="3" style={{ fill: 'var(--accent)' }} />
              <rect x="2" y="5" width="3" height="1" style={{ fill: 'var(--accent)' }} />
              <rect x="28" y="24" width="2" height="1" style={{ fill: 'var(--accent)' }} />
              <rect x="29" y="23" width="1" height="3" style={{ fill: 'var(--accent)' }} />
            </>
          )}
        </svg>

        {/* Tumbling retro pixel-art isometric dice */}
        <PixelDiceCube
          top={frame.top}
          left={frame.left}
          right={frame.right}
          className="w-full h-full transition-transform duration-75 ease-linear"
          style={{
            transform: `translateY(${frame.y}px) rotate(${frame.rot}deg) scale(${frame.sx}, ${frame.sy})`,
          }}
        />
      </div>
    </main>
  );
};
