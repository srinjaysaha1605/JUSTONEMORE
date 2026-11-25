import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import {
  ACHIEVEMENTS,
  BAILOUT_AMOUNT,
  CHEAT_COINS_AMOUNT,
  DAILY_REWARD_AMOUNT,
  applyCheatCoins,
  canClaimBailout,
  canClaimDaily,
  createInitialArcadeState,
  settleRound,
  type RoundSettlementInput,
} from '../engine/economy';
import type { AchievementId, ArcadeSettings, ArcadeState } from '../engine/types';

const STORAGE_KEY = 'luck_zero_arcade_save_v1';

function loadSavedState(): ArcadeState {
  if (typeof window === 'undefined') return createInitialArcadeState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialArcadeState();
    const parsed = JSON.parse(raw) as Partial<ArcadeState>;
    const base = createInitialArcadeState();
    return {
      balance:
        typeof parsed.balance === 'number' && Number.isFinite(parsed.balance)
          ? Math.max(0, Math.round(parsed.balance))
          : base.balance,
      stats: {
        ...base.stats,
        ...(parsed.stats ?? {}),
        playCounts: {
          ...base.stats.playCounts,
          ...(parsed.stats?.playCounts ?? {}),
        },
      },
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
        ? parsed.unlockedAchievements
        : base.unlockedAchievements,
      history: Array.isArray(parsed.history) ? parsed.history : base.history,
      lastDailyClaim:
        typeof parsed.lastDailyClaim === 'number' ? parsed.lastDailyClaim : null,
      settings: {
        ...base.settings,
        ...(parsed.settings ?? {}),
      },
    };
  } catch {
    return createInitialArcadeState();
  }
}

export interface AchievementToast {
  id: AchievementId;
  title: string;
}

export function useArcadeStore() {
  const [state, setState] = useState<ArcadeState>(() => loadSavedState());
  const stateRef = useRef<ArcadeState>(state);
  const [toastQueue, setToastQueue] = useState<AchievementToast[]>([]);

  useEffect(() => {
    stateRef.current = state;
    soundEngine.setEnabled(state.settings.soundEnabled);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle(
        'theme-mono',
        state.settings.theme === 'mono'
      );
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    if (toastQueue.length === 0) return;
    const timer = window.setTimeout(() => {
      setToastQueue((q) => q.slice(1));
    }, 3400);
    return () => window.clearTimeout(timer);
  }, [toastQueue]);

  const placeBet = useCallback((amount: number): boolean => {
    const cur = stateRef.current;
    if (!Number.isInteger(amount) || amount < 1 || amount > cur.balance) {
      return false;
    }
    const next: ArcadeState = {
      ...cur,
      balance: cur.balance - amount,
    };
    stateRef.current = next;
    setState(next);
    return true;
  }, []);

  const completeRound = useCallback((input: RoundSettlementInput) => {
    const cur = stateRef.current;
    const { nextState, newlyUnlocked } = settleRound(cur, input);
    stateRef.current = nextState;
    setState(nextState);
    if (newlyUnlocked.length > 0) {
      const items = newlyUnlocked.map((id) => ({
        id,
        title: ACHIEVEMENTS.find((a) => a.id === id)?.title ?? id,
      }));
      setToastQueue((q) => [...q, ...items]);
    }
  }, []);

  const claimDailyReward = useCallback((): boolean => {
    const now = Date.now();
    const cur = stateRef.current;
    if (!canClaimDaily(cur.lastDailyClaim, now)) return false;
    const next: ArcadeState = {
      ...cur,
      balance: cur.balance + DAILY_REWARD_AMOUNT,
      lastDailyClaim: now,
    };
    stateRef.current = next;
    setState(next);
    soundEngine.coin();
    return true;
  }, []);

  const claimBailout = useCallback((): boolean => {
    const cur = stateRef.current;
    if (!canClaimBailout(cur.balance)) return false;
    const unlocked = new Set<AchievementId>(cur.unlockedAchievements);
    if (!unlocked.has('zeroed_out')) {
      unlocked.add('zeroed_out');
      setToastQueue((q) => [...q, { id: 'zeroed_out', title: 'ZEROED OUT' }]);
    }
    const next: ArcadeState = {
      ...cur,
      balance: cur.balance + BAILOUT_AMOUNT,
      unlockedAchievements: Array.from(unlocked),
    };
    stateRef.current = next;
    setState(next);
    soundEngine.coin();
    return true;
  }, []);

  const updateSettings = useCallback((patch: Partial<ArcadeSettings>) => {
    const cur = stateRef.current;
    const next: ArcadeState = {
      ...cur,
      settings: {
        ...cur.settings,
        ...patch,
      },
    };
    stateRef.current = next;
    setState(next);
  }, []);

  const toggleSound = useCallback(() => {
    const cur = stateRef.current;
    const nextEnabled = !cur.settings.soundEnabled;
    soundEngine.setEnabled(nextEnabled);
    if (nextEnabled) soundEngine.click();
    const next: ArcadeState = {
      ...cur,
      settings: {
        ...cur.settings,
        soundEnabled: nextEnabled,
      },
    };
    stateRef.current = next;
    setState(next);
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = createInitialArcadeState();
    const next: ArcadeState = {
      ...fresh,
      settings: stateRef.current.settings,
    };
    stateRef.current = next;
    setState(next);
    soundEngine.click();
  }, []);

  const toggleTheme = useCallback(() => {
    const cur = stateRef.current;
    const nextTheme = cur.settings.theme === 'mono' ? 'green' : 'mono';
    soundEngine.click();
    const next: ArcadeState = {
      ...cur,
      settings: {
        ...cur.settings,
        theme: nextTheme,
      },
    };
    stateRef.current = next;
    setState(next);
  }, []);

  const toggleCrt = useCallback(() => {
    const cur = stateRef.current;
    const nextCrt = !cur.settings.scanlinesEnabled;
    soundEngine.click();
    const next: ArcadeState = {
      ...cur,
      settings: {
        ...cur.settings,
        scanlinesEnabled: nextCrt,
      },
    };
    stateRef.current = next;
    setState(next);
  }, []);

  const cheatCoins = useCallback(() => {
    const next = applyCheatCoins(stateRef.current, CHEAT_COINS_AMOUNT);
    stateRef.current = next;
    setState(next);
  }, []);

  return {
    state,
    toastQueue,
    placeBet,
    completeRound,
    claimDailyReward,
    claimBailout,
    cheatCoins,
    updateSettings,
    toggleSound,
    toggleTheme,
    toggleCrt,
    resetProgress,
  };
}
