import React from 'react';
import type { GameId } from '../engine/types';
import type { SlotSymbol } from '../engine/gamesMath';

export const GamePixelIcon: React.FC<{ gameId: GameId; className?: string }> = ({
  gameId,
  className = 'w-12 h-12',
}) => {
  switch (gameId) {
    case 'mines':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
          <rect x="7" y="1" width="2" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="9" y="2" width="2" height="1" style={{ fill: 'var(--accent)' }} />
          <rect x="6" y="3" width="4" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="4" y="5" width="8" height="8" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="3" y="6" width="10" height="6" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="5" y="7" width="2" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="6" y="11" width="4" height="2" style={{ fill: 'var(--border-lcd)' }} />
        </svg>
      );
    case 'plinko':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
          <rect x="7" y="1" width="2" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="7" y="4" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="4" y="7" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="10" y="7" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="2" y="10" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="7" y="10" width="2" height="2" style={{ fill: 'var(--accent)' }} />
          <rect x="12" y="10" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="1" y="13" width="3" height="2" style={{ fill: 'var(--border-lcd)' }} />
          <rect x="6" y="13" width="4" height="2" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="12" y="13" width="3" height="2" style={{ fill: 'var(--border-lcd)' }} />
        </svg>
      );
    case 'slots':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
          <rect x="1" y="3" width="14" height="10" style={{ fill: 'var(--border-lcd)' }} />
          <rect x="2" y="4" width="12" height="8" style={{ fill: 'var(--bg-screen)' }} />
          <rect x="3" y="5" width="3" height="6" style={{ fill: 'var(--bg-surface-hover)' }} />
          <rect x="6" y="5" width="4" height="6" style={{ fill: 'var(--bg-surface-hover)' }} />
          <rect x="10" y="5" width="3" height="6" style={{ fill: 'var(--bg-surface-hover)' }} />
          <rect x="3" y="6" width="2" height="1" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="4" y="7" width="1" height="3" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="7" y="6" width="2" height="1" style={{ fill: 'var(--accent)' }} />
          <rect x="8" y="7" width="1" height="3" style={{ fill: 'var(--accent)' }} />
          <rect x="11" y="6" width="2" height="1" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="12" y="7" width="1" height="3" style={{ fill: 'var(--ink-primary)' }} />
        </svg>
      );
    case 'dice':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
          <rect x="2" y="2" width="12" height="12" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="3" y="3" width="10" height="10" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="4" y="4" width="2" height="2" style={{ fill: 'var(--bg-casing)' }} />
          <rect x="10" y="4" width="2" height="2" style={{ fill: 'var(--bg-casing)' }} />
          <rect x="7" y="7" width="2" height="2" style={{ fill: 'var(--bg-casing)' }} />
          <rect x="4" y="10" width="2" height="2" style={{ fill: 'var(--bg-casing)' }} />
          <rect x="10" y="10" width="2" height="2" style={{ fill: 'var(--bg-casing)' }} />
        </svg>
      );
    case 'crash':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
          <rect x="11" y="2" width="3" height="3" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="9" y="4" width="3" height="3" style={{ fill: 'var(--accent)' }} />
          <rect x="7" y="6" width="3" height="3" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="5" y="8" width="3" height="3" style={{ fill: 'var(--border-bright)' }} />
          <rect x="3" y="10" width="2" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="2" y="12" width="2" height="2" style={{ fill: 'var(--ink-muted)' }} />
          <rect x="12" y="5" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="9" y="2" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
        </svg>
      );
    case 'wheel':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
          <rect x="5" y="1" width="6" height="2" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="3" y="3" width="10" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="2" y="5" width="12" height="6" style={{ fill: 'var(--border-bright)' }} />
          <rect x="3" y="11" width="10" height="2" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="5" y="13" width="6" height="2" style={{ fill: 'var(--border-lcd)' }} />
          <rect x="7" y="7" width="2" height="2" style={{ fill: 'var(--bg-casing)' }} />
          <rect x="7" y="3" width="2" height="3" style={{ fill: 'var(--accent)' }} />
        </svg>
      );
    case 'tower':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
          <rect x="4" y="1" width="2" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="7" y="1" width="2" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="10" y="1" width="2" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="4" y="3" width="8" height="3" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="4" y="7" width="8" height="3" style={{ fill: 'var(--border-bright)' }} />
          <rect x="3" y="11" width="10" height="4" style={{ fill: 'var(--border-lcd)' }} />
          <rect x="7" y="12" width="2" height="3" style={{ fill: 'var(--bg-screen)' }} />
        </svg>
      );
    case 'coinflip':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
          <rect x="5" y="1" width="6" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="3" y="3" width="10" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="2" y="5" width="12" height="6" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="3" y="11" width="10" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="5" y="13" width="6" height="2" style={{ fill: 'var(--border-lcd)' }} />
          <rect x="5" y="4" width="6" height="8" style={{ fill: 'var(--bg-screen)' }} />
          <rect x="6" y="5" width="4" height="1" style={{ fill: 'var(--accent)' }} />
          <rect x="8" y="6" width="2" height="2" style={{ fill: 'var(--accent)' }} />
          <rect x="6" y="8" width="2" height="2" style={{ fill: 'var(--accent)' }} />
          <rect x="6" y="10" width="4" height="1" style={{ fill: 'var(--accent)' }} />
        </svg>
      );
    case 'cups':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
          <rect x="2" y="5" width="3" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="1" y="7" width="5" height="4" style={{ fill: 'var(--border-lcd)' }} />
          <rect x="11" y="5" width="3" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="10" y="7" width="5" height="4" style={{ fill: 'var(--border-lcd)' }} />
          <rect x="6" y="2" width="4" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="5" y="4" width="6" height="5" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="6" y="11" width="4" height="3" style={{ fill: 'var(--accent)' }} />
          <rect x="7" y="12" width="2" height="1" style={{ fill: 'var(--bg-casing)' }} />
        </svg>
      );
    case 'keno':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
          <rect x="1" y="1" width="14" height="14" style={{ fill: 'var(--border-lcd)' }} />
          <rect x="2" y="2" width="12" height="12" style={{ fill: 'var(--bg-screen)' }} />
          <rect x="3" y="3" width="2" height="2" style={{ fill: 'var(--accent)' }} />
          <rect x="7" y="3" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="11" y="3" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="3" y="7" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="7" y="7" width="2" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="11" y="7" width="2" height="2" style={{ fill: 'var(--accent)' }} />
          <rect x="3" y="11" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="7" y="11" width="2" height="2" style={{ fill: 'var(--accent)' }} />
          <rect x="11" y="11" width="2" height="2" style={{ fill: 'var(--border-bright)' }} />
        </svg>
      );
  }
};

export const SlotSymbolPixel: React.FC<{
  symbol: SlotSymbol;
  className?: string;
  decorative?: boolean;
}> = ({ symbol, className = 'w-12 h-12', decorative = false }) => {
  const a11y = (label: string) =>
    decorative ? { 'aria-hidden': true as const } : { 'aria-label': label };

  switch (symbol) {
    case 'SEVEN':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} {...a11y('Lucky Seven')}>
          <rect x="3" y="2" width="10" height="3" style={{ fill: 'var(--accent)' }} />
          <rect x="10" y="5" width="3" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="8" y="7" width="3" height="3" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="6" y="10" width="3" height="4" style={{ fill: 'var(--accent)' }} />
        </svg>
      );
    case 'STAR':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} {...a11y('Star')}>
          <rect x="7" y="1" width="2" height="3" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="5" y="4" width="6" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="1" y="6" width="14" height="2" style={{ fill: 'var(--accent)' }} />
          <rect x="3" y="8" width="10" height="2" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="4" y="10" width="3" height="4" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="9" y="10" width="3" height="4" style={{ fill: 'var(--accent-mid)' }} />
        </svg>
      );
    case 'COIN':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} {...a11y('Zero Coin')}>
          <rect x="5" y="2" width="6" height="12" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="3" y="4" width="10" height="8" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="6" y="5" width="4" height="6" style={{ fill: 'var(--bg-screen)' }} />
          <rect x="7" y="6" width="2" height="4" style={{ fill: 'var(--accent)' }} />
        </svg>
      );
    case 'CHERRY':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} {...a11y('Cherries')}>
          <rect x="8" y="2" width="3" height="2" style={{ fill: 'var(--border-bright)' }} />
          <rect x="6" y="4" width="2" height="4" style={{ fill: 'var(--border-bright)' }} />
          <rect x="10" y="4" width="2" height="5" style={{ fill: 'var(--border-bright)' }} />
          <rect x="3" y="8" width="5" height="5" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="9" y="9" width="5" height="5" style={{ fill: 'var(--accent-mid)' }} />
          <rect x="4" y="9" width="2" height="2" style={{ fill: 'var(--ink-primary)' }} />
          <rect x="10" y="10" width="2" height="2" style={{ fill: 'var(--ink-primary)' }} />
        </svg>
      );
    case 'SKULL':
      return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} {...a11y('Skull')}>
          <rect x="4" y="2" width="8" height="8" style={{ fill: 'var(--ink-muted)' }} />
          <rect x="3" y="4" width="10" height="5" style={{ fill: 'var(--ink-muted)' }} />
          <rect x="5" y="5" width="2" height="2" style={{ fill: 'var(--bg-casing)' }} />
          <rect x="9" y="5" width="2" height="2" style={{ fill: 'var(--bg-casing)' }} />
          <rect x="5" y="10" width="6" height="3" style={{ fill: 'var(--border-bright)' }} />
          <rect x="6" y="11" width="1" height="2" style={{ fill: 'var(--bg-casing)' }} />
          <rect x="9" y="11" width="1" height="2" style={{ fill: 'var(--bg-casing)' }} />
        </svg>
      );
  }
};
