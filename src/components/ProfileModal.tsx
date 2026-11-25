import React from 'react';
import { X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import {
  ACHIEVEMENTS,
  getLevelFromXp,
  getMostPlayedGame,
} from '../engine/economy';
import type { ArcadeState } from '../engine/types';

interface ProfileModalProps {
  state: ArcadeState;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ state, onClose }) => {
  const { stats, unlockedAchievements } = state;
  const lvl = getLevelFromXp(stats.xp);
  const mostPlayed = getMostPlayedGame(stats.playCounts);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-4"
    >
      <div className="lcd-screen w-full max-w-3xl max-h-[88vh] overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b-2 border-[var(--border-lcd)] pb-3">
          <h2
            id="profile-modal-title"
            className="font-pixel text-base sm:text-lg text-[var(--ink-primary)]"
          >
            PLAYER RECORD
          </h2>
          <button
            type="button"
            onClick={() => {
              soundEngine.click();
              onClose();
            }}
            aria-label="Close player record"
            className="pixel-btn bg-[var(--bg-surface)] p-2 text-[var(--ink-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Level & XP Bar */}
        <div className="lcd-panel p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between font-pixel text-xs sm:text-sm">
            <span className="text-[var(--accent)]">LEVEL {lvl.level}</span>
            <span className="text-[var(--ink-muted)] tabular-nums">
              {lvl.currentXp} / {lvl.nextLevelXp} XP
            </span>
          </div>
          <div className="h-4 bg-[var(--bg-casing)] border-2 border-[var(--border-lcd)]">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${lvl.progressPct}%` }}
            />
          </div>
        </div>

        {/* Core Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono-body">
          <div className="lcd-panel p-3">
            <div className="text-[var(--ink-muted)]">GAMES</div>
            <div className="font-pixel text-base text-[var(--ink-primary)] tabular-nums mt-1">
              {stats.gamesPlayed}
            </div>
          </div>
          <div className="lcd-panel p-3">
            <div className="text-[var(--ink-muted)]">BEST STREAK</div>
            <div className="font-pixel text-base text-[var(--ink-primary)] tabular-nums mt-1">
              {stats.bestWinStreak}
            </div>
          </div>
          <div className="lcd-panel p-3">
            <div className="text-[var(--ink-muted)]">BIGGEST WIN</div>
            <div className="font-pixel text-base text-[var(--accent)] tabular-nums mt-1">
              {stats.biggestWin.toLocaleString()} ZC
            </div>
          </div>
          <div className="lcd-panel p-3">
            <div className="text-[var(--ink-muted)]">FAVORITE</div>
            <div className="font-pixel text-xs sm:text-sm text-[var(--ink-primary)] mt-1 truncate">
              {mostPlayed}
            </div>
          </div>
          <div className="lcd-panel p-3 col-span-2">
            <div className="text-[var(--ink-muted)]">LIFETIME WON</div>
            <div className="font-pixel text-sm text-[var(--accent)] tabular-nums mt-1">
              +{stats.totalWon.toLocaleString()} ZC
            </div>
          </div>
          <div className="lcd-panel p-3 col-span-2">
            <div className="text-[var(--ink-muted)]">LIFETIME LOST</div>
            <div className="font-pixel text-sm text-[var(--ink-primary)] tabular-nums mt-1">
              -{stats.totalLost.toLocaleString()} ZC
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="flex flex-col gap-2.5">
          <h3 className="font-pixel text-xs text-[var(--ink-muted)]">
            ACHIEVEMENTS ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = unlockedAchievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`border-2 p-3 flex flex-col gap-1 ${
                    unlocked
                      ? 'bg-[var(--bg-surface-hover)] border-[var(--accent)]'
                      : 'bg-[var(--bg-canvas)] border-[var(--border-lcd)]/60 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-pixel text-xs text-[var(--ink-primary)]">
                      {ach.title}
                    </span>
                    <span
                      className={`font-pixel text-[10px] ${
                        unlocked ? 'text-[var(--accent)]' : 'text-[var(--ink-muted)]'
                      }`}
                    >
                      {unlocked ? 'UNLOCKED' : 'LOCKED'}
                    </span>
                  </div>
                  <p className="font-mono-body text-xs text-[var(--ink-muted)]">
                    {ach.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
