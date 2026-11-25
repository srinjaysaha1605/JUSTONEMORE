import React, { useState } from 'react';

interface ZeroLogoProps {
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  boosting?: boolean;
  onClick?: () => void;
}

interface PixelSpark {
  id: number;
  x: number;
  y: number;
}

export type TopDicePip = 1 | 2 | 3 | 4 | 5;
export type SideDicePip = 1 | 2 | 3 | 4 | 5 | 6;

const TOP_PIPS: Record<TopDicePip, Array<[number, number]>> = {
  1: [[15, 8]],
  2: [
    [11, 7],
    [19, 10],
  ],
  3: [
    [11, 6],
    [15, 8],
    [19, 10],
  ],
  4: [
    [15, 5],
    [9, 8],
    [21, 8],
    [15, 11],
  ],
  5: [
    [15, 5],
    [9, 8],
    [15, 8],
    [21, 8],
    [15, 11],
  ],
};

const LEFT_PIPS: Record<SideDicePip, Array<[number, number]>> = {
  1: [[9, 16]],
  2: [
    [6, 13],
    [12, 19],
  ],
  3: [
    [6, 13],
    [9, 16],
    [12, 19],
  ],
  4: [
    [6, 12],
    [6, 18],
    [12, 16],
    [12, 22],
  ],
  5: [
    [6, 12],
    [6, 18],
    [9, 16],
    [12, 16],
    [12, 22],
  ],
  6: [
    [6, 12],
    [6, 15],
    [6, 18],
    [12, 16],
    [12, 19],
    [12, 22],
  ],
};

const RIGHT_PIPS: Record<SideDicePip, Array<[number, number]>> = {
  1: [[21, 16]],
  2: [
    [18, 21],
    [23, 13],
  ],
  3: [
    [18, 21],
    [21, 16],
    [23, 13],
  ],
  4: [
    [18, 16],
    [18, 21],
    [23, 13],
    [23, 18],
  ],
  5: [
    [18, 16],
    [18, 21],
    [21, 16],
    [23, 13],
    [23, 18],
  ],
  6: [
    [18, 16],
    [18, 19],
    [18, 22],
    [23, 13],
    [23, 16],
    [23, 19],
  ],
};

interface PixelDiceCubeProps {
  top?: TopDicePip;
  left?: SideDicePip;
  right?: SideDicePip;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  children?: React.ReactNode;
}

export const PixelDiceCube: React.FC<PixelDiceCubeProps> = ({
  top = 5,
  left = 3,
  right = 4,
  className = 'w-full h-full',
  style,
  ariaLabel,
  children,
}) => (
  <svg
    viewBox="0 0 32 32"
    shapeRendering="crispEdges"
    className={className}
    style={style}
    {...(ariaLabel ? { 'aria-label': ariaLabel } : { 'aria-hidden': true as const })}
  >
    {children}

    {/* Outer dark casing outline */}
    <rect x="13" y="2" width="6" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="11" y="3" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="19" y="3" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="9" y="4" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="21" y="4" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="7" y="5" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="23" y="5" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="5" y="6" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="25" y="6" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="4" y="7" width="1" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="27" y="7" width="1" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="3" y="8" width="1" height="14" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="28" y="8" width="1" height="14" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="4" y="22" width="1" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="27" y="22" width="1" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="5" y="23" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="25" y="23" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="7" y="24" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="23" y="24" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="9" y="25" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="21" y="25" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="11" y="26" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="19" y="26" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
    <rect x="13" y="27" width="6" height="1" style={{ fill: 'var(--bg-casing)' }} />

    {/* Top face (brightest LCD tone) */}
    <rect x="15" y="3" width="2" height="1" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="13" y="4" width="6" height="1" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="11" y="5" width="10" height="1" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="9" y="6" width="14" height="1" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="7" y="7" width="18" height="1" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="5" y="8" width="22" height="1" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="4" y="9" width="24" height="1" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="5" y="10" width="22" height="1" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="7" y="11" width="18" height="1" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="9" y="12" width="14" height="1" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="11" y="13" width="10" height="1" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="13" y="14" width="6" height="1" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="15" y="15" width="2" height="1" style={{ fill: 'var(--ink-primary)' }} />
    <rect x="15" y="14" width="2" height="1" style={{ fill: 'var(--accent)' }} />

    {/* Left face (mid-bright LCD tone) */}
    <rect x="4" y="10" width="1" height="12" style={{ fill: 'var(--accent)' }} />
    <rect x="5" y="11" width="2" height="12" style={{ fill: 'var(--accent-mid)' }} />
    <rect x="7" y="12" width="2" height="12" style={{ fill: 'var(--accent-mid)' }} />
    <rect x="9" y="13" width="2" height="12" style={{ fill: 'var(--accent-mid)' }} />
    <rect x="11" y="14" width="2" height="12" style={{ fill: 'var(--accent-mid)' }} />
    <rect x="13" y="15" width="2" height="12" style={{ fill: 'var(--accent-mid)' }} />
    <rect x="15" y="16" width="1" height="11" style={{ fill: 'var(--ink-primary)' }} />

    {/* Right face (shaded LCD tone) */}
    <rect x="16" y="16" width="1" height="11" style={{ fill: 'var(--border-lcd)' }} />
    <rect x="17" y="15" width="2" height="11" style={{ fill: 'var(--border-bright)' }} />
    <rect x="19" y="14" width="2" height="11" style={{ fill: 'var(--border-bright)' }} />
    <rect x="21" y="13" width="2" height="11" style={{ fill: 'var(--border-bright)' }} />
    <rect x="23" y="12" width="2" height="11" style={{ fill: 'var(--border-bright)' }} />
    <rect x="25" y="11" width="2" height="11" style={{ fill: 'var(--border-bright)' }} />
    <rect x="27" y="10" width="1" height="12" style={{ fill: 'var(--border-lcd)' }} />

    {/* Right face bottom shadow bevel */}
    <rect x="17" y="25" width="2" height="1" style={{ fill: 'var(--border-lcd)' }} />
    <rect x="19" y="24" width="2" height="1" style={{ fill: 'var(--border-lcd)' }} />
    <rect x="21" y="23" width="2" height="1" style={{ fill: 'var(--border-lcd)' }} />
    <rect x="23" y="22" width="2" height="1" style={{ fill: 'var(--border-lcd)' }} />
    <rect x="25" y="21" width="2" height="1" style={{ fill: 'var(--border-lcd)' }} />

    {/* Dynamic face pips */}
    {TOP_PIPS[top].map(([px, py], i) => (
      <rect
        key={`t-${i}`}
        x={px}
        y={py}
        width="2"
        height="2"
        style={{ fill: 'var(--bg-casing)' }}
      />
    ))}
    {LEFT_PIPS[left].map(([px, py], i) => (
      <rect
        key={`l-${i}`}
        x={px}
        y={py}
        width="2"
        height="2"
        style={{ fill: 'var(--bg-casing)' }}
      />
    ))}
    {RIGHT_PIPS[right].map(([px, py], i) => (
      <rect
        key={`r-${i}`}
        x={px}
        y={py}
        width="2"
        height="2"
        style={{ fill: 'var(--bg-casing)' }}
      />
    ))}
  </svg>
);

export const ZeroLogo: React.FC<ZeroLogoProps> = ({
  size = 'lg',
  interactive = false,
  boosting = false,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [sparks, setSparks] = useState<PixelSpark[]>([]);

  const dim =
    size === 'sm'
      ? 'w-9 h-9 md:w-11 md:h-11'
      : size === 'md'
      ? 'w-16 h-16 md:w-20 md:h-20'
      : 'w-44 h-44 sm:w-52 sm:h-52 lg:w-64 lg:h-64';

  const spawnSparks = () => {
    if (!interactive) return;
    const burst: PixelSpark[] = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.4;
      const dist = 36 + Math.random() * 24;
      return {
        id: Date.now() + i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
      };
    });
    setSparks(burst);
    window.setTimeout(() => setSparks([]), 450);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const dy = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    setTilt({ x: dx, y: dy });
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${dim} ${
        interactive ? 'cursor-pointer' : ''
      }`}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => {
        if (!interactive) return;
        setHovered(false);
        setTilt({ x: 0, y: 0 });
      }}
      onMouseMove={handleMouseMove}
      onClick={() => {
        spawnSparks();
        onClick?.();
      }}
    >
      {interactive && (
        <div
          aria-hidden="true"
          className="absolute inset-4 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--accent) 28%, transparent) 0%, transparent 70%)',
            opacity: hovered || boosting ? 1 : 0.45,
          }}
        />
      )}

      {sparks.map((s) => (
        <span
          key={s.id}
          aria-hidden="true"
          className="absolute w-2 h-2 bg-[var(--accent)] pointer-events-none transition-all duration-300"
          style={{
            transform: `translate(${s.x}px, ${s.y}px) scale(0.4)`,
            opacity: 0,
          }}
        />
      ))}

      <PixelDiceCube
        top={5}
        left={3}
        right={4}
        className="w-full h-full transition-transform duration-200 ease-out"
        style={{
          transform: boosting
            ? 'scale(1.18) rotate(90deg)'
            : interactive
            ? `perspective(420px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) scale(${
                hovered ? 1.05 : 1
              })`
            : undefined,
        }}
        ariaLabel="JUSTONEMORE retro arcade dice logo"
      >
        {/* Pixel ground shadow */}
        <rect x="10" y="29" width="12" height="1" style={{ fill: 'var(--border-lcd)' }} />
        <rect x="8" y="28" width="16" height="1" style={{ fill: 'var(--bg-surface-hover)' }} />

        {/* Retro arcade corner pixel glints */}
        <g
          className={interactive ? 'transition-transform duration-300' : ''}
          style={{
            transform: hovered || boosting ? 'scale(1.08)' : 'scale(1)',
            transformOrigin: '16px 16px',
          }}
        >
          <rect x="3" y="4" width="1" height="3" style={{ fill: 'var(--accent)' }} />
          <rect x="2" y="5" width="3" height="1" style={{ fill: 'var(--accent)' }} />

          <rect x="28" y="4" width="1" height="1" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="29" y="5" width="1" height="1" style={{ fill: 'var(--border-bright)' }} />

          <rect x="2" y="23" width="1" height="1" style={{ fill: 'var(--border-bright)' }} />
          <rect x="28" y="24" width="2" height="1" style={{ fill: 'var(--accent)' }} />
          <rect x="29" y="23" width="1" height="3" style={{ fill: 'var(--accent)' }} />
        </g>
      </PixelDiceCube>
    </div>
  );
};
