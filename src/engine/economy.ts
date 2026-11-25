import type {
  AchievementId,
  ArcadeState,
  GameId,
  GameMeta,
  HistoryEntry,
  PlayerStats,
} from './types';

export const STARTING_BALANCE = 1000;
export const DAILY_REWARD_AMOUNT = 250;
export const DAILY_REWARD_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const BAILOUT_AMOUNT = 500;
export const MAX_HISTORY_ENTRIES = 200;

export const GAMES_CATALOG: GameMeta[] = [
  {
    id: 'mines',
    name: 'MINES',
    shortDesc: 'Uncover safe tiles. Dodge hidden bombs.',
  },
  {
    id: 'plinko',
    name: 'PLINKO',
    shortDesc: 'Drop a marble down the pegboard.',
  },
  {
    id: 'slots',
    name: 'PIXEL SLOTS',
    shortDesc: 'Three spinning reels. Classic pixel symbols.',
  },
  {
    id: 'dice',
    name: 'DICE',
    shortDesc: 'Predict higher or lower than your target.',
  },
  {
    id: 'crash',
    name: 'CRASH',
    shortDesc: 'Ride the multiplier. Bail before boom.',
  },
  {
    id: 'wheel',
    name: 'LUCKY WHEEL',
    shortDesc: 'Spin twenty wedges for big multipliers.',
  },
  {
    id: 'tower',
    name: 'TOWER',
    shortDesc: 'Climb eight floors without hitting traps.',
  },
  {
    id: 'coinflip',
    name: 'COIN FLIP',
    shortDesc: 'Double or nothing streak. Cash out anytime.',
  },
  {
    id: 'cups',
    name: 'SHELL SHUFFLE',
    shortDesc: 'Track the hidden coin across cup swaps.',
  },
  {
    id: 'keno',
    name: 'PIXEL KENO',
    shortDesc: 'Mark grid numbers and match the 10-ball draw.',
  },
];

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_blood',
    title: 'FIRST BLOOD',
    description: 'Play your first game.',
  },
  {
    id: 'lucky_bastard',
    title: 'LUCKY BASTARD',
    description: 'Win 10 rounds.',
  },
  {
    id: 'house_broken',
    title: 'HOUSE BROKEN',
    description: 'Win 500 ZC or more in a single round.',
  },
  {
    id: 'professional_loser',
    title: 'PROFESSIONAL LOSER',
    description: 'Lose 10 rounds in a row.',
  },
  {
    id: 'one_more_round',
    title: 'ONE MORE ROUND',
    description: 'Play 100 total games.',
  },
  {
    id: 'absolute_cinema',
    title: 'ABSOLUTE CINEMA',
    description: 'Hit a rare jackpot (10x+ or 7-7-7).',
  },
  {
    id: 'zeroed_out',
    title: 'ZEROED OUT',
    description: 'Hit 0 ZC and claim free recovery coins.',
  },
  {
    id: 'diamond_hands',
    title: 'DIAMOND HANDS',
    description: 'Cash out at 5.00x or higher in Crash.',
  },
];

export function createInitialStats(): PlayerStats {
  return {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
    currentLossStreak: 0,
    totalWon: 0,
    totalLost: 0,
    biggestWin: 0,
    xp: 0,
    playCounts: {
      mines: 0,
      plinko: 0,
      slots: 0,
      dice: 0,
      crash: 0,
      wheel: 0,
      tower: 0,
      coinflip: 0,
      cups: 0,
      keno: 0,
    },
  };
}

export function createInitialArcadeState(): ArcadeState {
  return {
    balance: STARTING_BALANCE,
    stats: createInitialStats(),
    unlockedAchievements: [],
    history: [],
    lastDailyClaim: null,
    settings: {
      soundEnabled: true,
      scanlinesEnabled: true,
      flickerEnabled: true,
      theme: 'green',
    },
  };
}

export function validateBet(
  bet: number,
  balance: number
): { valid: boolean; reason?: string } {
  if (!Number.isFinite(bet) || !Number.isInteger(bet)) {
    return { valid: false, reason: 'Bet must be a whole number.' };
  }
  if (bet < 1) {
    return { valid: false, reason: 'Minimum bet is 1 ZC.' };
  }
  if (bet > balance) {
    return { valid: false, reason: 'Insufficient ZERO COINS.' };
  }
  return { valid: true };
}

export function getLevelFromXp(xp: number): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progressPct: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 1;
  let remaining = safeXp;
  let needed = 100;

  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = 100 + (level - 1) * 50;
  }

  return {
    level,
    currentXp: remaining,
    nextLevelXp: needed,
    progressPct: Math.min(100, Math.round((remaining / needed) * 100)),
  };
}

export function canClaimDaily(
  lastDailyClaim: number | null,
  now: number = Date.now()
): boolean {
  if (lastDailyClaim === null) return true;
  return now - lastDailyClaim >= DAILY_REWARD_COOLDOWN_MS;
}

export function msUntilDaily(
  lastDailyClaim: number | null,
  now: number = Date.now()
): number {
  if (lastDailyClaim === null) return 0;
  return Math.max(0, DAILY_REWARD_COOLDOWN_MS - (now - lastDailyClaim));
}

export function formatDuration(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function canClaimBailout(balance: number): boolean {
  return balance < 1;
}

export function getMostPlayedGame(playCounts: Record<GameId, number>): string {
  let topId: GameId | null = null;
  let topCount = 0;
  for (const meta of GAMES_CATALOG) {
    const count = playCounts[meta.id] ?? 0;
    if (count > topCount) {
      topCount = count;
      topId = meta.id;
    }
  }
  if (!topId) return 'NONE';
  return GAMES_CATALOG.find((g) => g.id === topId)?.name ?? 'NONE';
}

export interface RoundSettlementInput {
  gameId: GameId;
  gameName: string;
  bet: number;
  payout: number;
  multiplier: number;
  isJackpot?: boolean;
  note?: string;
  timestamp?: number;
  id?: string;
}

export function settleRound(
  state: ArcadeState,
  input: RoundSettlementInput
): { nextState: ArcadeState; newlyUnlocked: AchievementId[] } {
  const timestamp = input.timestamp ?? Date.now();
  const payout = Math.max(0, Math.round(input.payout));
  const net = payout - input.bet;
  const isWin = payout > input.bet || (payout > 0 && input.multiplier >= 1);

  const prevStats = state.stats;
  const currentWinStreak = isWin ? prevStats.currentWinStreak + 1 : 0;
  const bestWinStreak = Math.max(prevStats.bestWinStreak, currentWinStreak);
  const currentLossStreak = isWin ? 0 : prevStats.currentLossStreak + 1;

  const xpGain = isWin ? 25 + Math.min(75, Math.floor(input.multiplier * 10)) : 12;

  const nextStats: PlayerStats = {
    gamesPlayed: prevStats.gamesPlayed + 1,
    wins: prevStats.wins + (isWin ? 1 : 0),
    losses: prevStats.losses + (isWin ? 0 : 1),
    currentWinStreak,
    bestWinStreak,
    currentLossStreak,
    totalWon: prevStats.totalWon + (net > 0 ? net : 0),
    totalLost: prevStats.totalLost + (net < 0 ? Math.abs(net) : 0),
    biggestWin: Math.max(prevStats.biggestWin, net > 0 ? net : 0),
    xp: prevStats.xp + xpGain,
    playCounts: {
      ...prevStats.playCounts,
      [input.gameId]: (prevStats.playCounts[input.gameId] ?? 0) + 1,
    },
  };

  const unlocked = new Set<AchievementId>(state.unlockedAchievements);
  const newlyUnlocked: AchievementId[] = [];
  const unlock = (id: AchievementId) => {
    if (!unlocked.has(id)) {
      unlocked.add(id);
      newlyUnlocked.push(id);
    }
  };

  if (nextStats.gamesPlayed >= 1) unlock('first_blood');
  if (nextStats.wins >= 10) unlock('lucky_bastard');
  if (net >= 500) unlock('house_broken');
  if (nextStats.currentLossStreak >= 10) unlock('professional_loser');
  if (nextStats.gamesPlayed >= 100) unlock('one_more_round');
  if (input.isJackpot || input.multiplier >= 10) unlock('absolute_cinema');
  if (input.gameId === 'crash' && isWin && input.multiplier >= 5) {
    unlock('diamond_hands');
  }

  const entry: HistoryEntry = {
    id: input.id ?? `${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    gameId: input.gameId,
    gameName: input.gameName,
    bet: input.bet,
    payout,
    net,
    multiplier: Number(input.multiplier.toFixed(2)),
    outcome: isWin ? 'WIN' : 'LOSS',
    timestamp,
    note: input.note,
  };

  const nextState: ArcadeState = {
    ...state,
    balance: state.balance + payout,
    stats: nextStats,
    unlockedAchievements: Array.from(unlocked),
    history: [entry, ...state.history].slice(0, MAX_HISTORY_ENTRIES),
  };

  return { nextState, newlyUnlocked };
}

export const CHEAT_COINS_AMOUNT = 10;

export function applyCheatCoins(
  state: ArcadeState,
  amount: number = CHEAT_COINS_AMOUNT
): ArcadeState {
  const safeAmount = Math.max(0, Math.round(amount));
  if (safeAmount === 0) return state;
  return {
    ...state,
    balance: state.balance + safeAmount,
  };
}

