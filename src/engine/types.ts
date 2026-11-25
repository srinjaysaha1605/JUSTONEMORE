export type GameId =
  | 'mines'
  | 'plinko'
  | 'slots'
  | 'dice'
  | 'crash'
  | 'wheel'
  | 'tower'
  | 'coinflip'
  | 'cups'
  | 'keno';

export type ScreenId =
  | 'landing'
  | 'lobby'
  | 'history'
  | GameId;

export type AchievementId =
  | 'first_blood'
  | 'lucky_bastard'
  | 'house_broken'
  | 'professional_loser'
  | 'one_more_round'
  | 'absolute_cinema'
  | 'zeroed_out'
  | 'diamond_hands';

export interface HistoryEntry {
  id: string;
  gameId: GameId;
  gameName: string;
  bet: number;
  payout: number;
  net: number;
  multiplier: number;
  outcome: 'WIN' | 'LOSS';
  timestamp: number;
  note?: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  currentWinStreak: number;
  bestWinStreak: number;
  currentLossStreak: number;
  totalWon: number;
  totalLost: number;
  biggestWin: number;
  xp: number;
  playCounts: Record<GameId, number>;
}

export type ArcadeTheme = 'green' | 'mono';

export interface ArcadeSettings {
  soundEnabled: boolean;
  scanlinesEnabled: boolean;
  flickerEnabled: boolean;
  theme: ArcadeTheme;
}

export interface ArcadeState {
  balance: number;
  stats: PlayerStats;
  unlockedAchievements: AchievementId[];
  history: HistoryEntry[];
  lastDailyClaim: number | null;
  settings: ArcadeSettings;
}

export interface GameMeta {
  id: GameId;
  name: string;
  shortDesc: string;
}
