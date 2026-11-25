import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';

interface BalanceBadgeProps {
  balance: number;
  onCheat: () => void;
  accentBorder?: boolean;
}

const TAP_WINDOW_MS = 1200;

export const BalanceBadge: React.FC<BalanceBadgeProps> = ({
  balance,
  onCheat,
  accentBorder = false,
}) => {
  const tapsRef = useRef<number[]>([]);
  const [flashed, setFlashed] = useState(false);
  const flashTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    };
  }, []);

  const handleTap = () => {
    const now = Date.now();
    const recent = tapsRef.current.filter((t) => now - t <= TAP_WINDOW_MS);
    recent.push(now);

    if (recent.length >= 3) {
      tapsRef.current = [];
      onCheat();
      soundEngine.coin();
      setFlashed(true);
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = window.setTimeout(() => {
        setFlashed(false);
      }, 650);
    } else {
      tapsRef.current = recent;
    }
  };

  return (
    <button
      type="button"
      data-testid="balance-readout"
      onClick={handleTap}
      aria-label={`${balance.toLocaleString()} ZC`}
      className={`px-3 py-1.5 font-pixel text-xs sm:text-sm md:text-base tabular-nums whitespace-nowrap select-none cursor-pointer border-2 transition-colors ${
        flashed
          ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--ink-primary)]'
          : accentBorder
          ? 'bg-[var(--bg-screen)] text-[var(--accent)] border-[var(--accent)]'
          : 'bg-[var(--bg-screen)] text-[var(--accent)] border-[var(--border-lcd)]'
      }`}
    >
      {flashed ? '+10 ZC' : `${balance.toLocaleString()} ZC`}
    </button>
  );
};
