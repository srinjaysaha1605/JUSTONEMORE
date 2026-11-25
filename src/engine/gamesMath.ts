export type RngFn = () => number;

export function calculatePayout(bet: number, multiplier: number): number {
  if (
    !Number.isFinite(bet) ||
    !Number.isFinite(multiplier) ||
    bet <= 0 ||
    multiplier <= 0
  ) {
    return 0;
  }
  return Math.max(0, Math.floor(bet * multiplier + 1e-9));
}

/* ---------------- MINES ---------------- */
export const MINES_GRID_SIZE = 25;

export function calculateMinesMultiplier(
  safeRevealed: number,
  minesCount: number,
  totalTiles: number = MINES_GRID_SIZE
): number {
  if (safeRevealed <= 0) return 1.0;
  const clampedMines = Math.max(1, Math.min(totalTiles - 1, minesCount));
  const maxSafe = totalTiles - clampedMines;
  const steps = Math.min(maxSafe, Math.floor(safeRevealed));
  let fairOdds = 1;
  for (let i = 0; i < steps; i++) {
    const remainingTiles = totalTiles - i;
    const remainingSafe = totalTiles - clampedMines - i;
    if (remainingSafe <= 0) break;
    fairOdds *= remainingTiles / remainingSafe;
  }
  const withEdge = fairOdds * 0.97;
  return Math.max(1.01, Math.floor(withEdge * 100) / 100);
}

export function generateMinesBoard(
  minesCount: number,
  rng: RngFn = Math.random,
  totalTiles: number = MINES_GRID_SIZE
): boolean[] {
  const clampedMines = Math.max(1, Math.min(totalTiles - 1, minesCount));
  const indices = Array.from({ length: totalTiles }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const board = Array<boolean>(totalTiles).fill(false);
  for (let i = 0; i < clampedMines; i++) {
    board[indices[i]] = true;
  }
  return board;
}

/* ---------------- PLINKO ---------------- */
export const PLINKO_ROWS = 10;
export const PLINKO_MULTIPLIERS = [
  16, 5, 2.2, 1.2, 0.6, 0.5, 0.6, 1.2, 2.2, 5, 16,
] as const;

export function getPlinkoMultiplierForSlot(slotIndex: number): number {
  const clamped = Math.max(
    0,
    Math.min(PLINKO_MULTIPLIERS.length - 1, Math.round(slotIndex))
  );
  return PLINKO_MULTIPLIERS[clamped];
}

/* ---------------- PIXEL SLOTS ---------------- */
export type SlotSymbol = 'CHERRY' | 'COIN' | 'STAR' | 'SKULL' | 'SEVEN';

export interface SlotSymbolSpec {
  id: SlotSymbol;
  label: string;
  weight: number;
}

export const SLOT_SYMBOLS: SlotSymbolSpec[] = [
  { id: 'CHERRY', label: 'CHERRY', weight: 7 },
  { id: 'COIN', label: 'COIN', weight: 5 },
  { id: 'STAR', label: 'STAR', weight: 4 },
  { id: 'SKULL', label: 'SKULL', weight: 2 },
  { id: 'SEVEN', label: 'SEVEN', weight: 2 },
];

export const SLOT_PAYTABLE = [
  { combo: '7 - 7 - 7', multiplier: 25, label: 'JACKPOT' },
  { combo: 'STAR x3', multiplier: 10, label: 'TRIPLE STAR' },
  { combo: 'COIN x3', multiplier: 6, label: 'TRIPLE COIN' },
  { combo: 'CHERRY x3', multiplier: 4, label: 'TRIPLE CHERRY' },
  { combo: 'ANY 2x SEVEN', multiplier: 2.5, label: 'DOUBLE SEVEN' },
  { combo: 'ANY 2x STAR/COIN', multiplier: 1.5, label: 'PAIR BONUS' },
  { combo: 'SKULL x3', multiplier: 0, label: 'CURSED ZERO' },
] as const;

export function pickSlotSymbol(rng: RngFn = Math.random): SlotSymbol {
  const total = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let roll = rng() * total;
  for (const s of SLOT_SYMBOLS) {
    roll -= s.weight;
    if (roll < 0) return s.id;
  }
  return SLOT_SYMBOLS[0].id;
}

export function evaluateSlotsSpin(reels: [SlotSymbol, SlotSymbol, SlotSymbol]): {
  multiplier: number;
  label: string;
  isJackpot: boolean;
} {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    switch (a) {
      case 'SEVEN':
        return { multiplier: 25, label: 'JACKPOT 7-7-7', isJackpot: true };
      case 'STAR':
        return { multiplier: 10, label: 'TRIPLE STAR', isJackpot: true };
      case 'COIN':
        return { multiplier: 6, label: 'TRIPLE COIN', isJackpot: false };
      case 'CHERRY':
        return { multiplier: 4, label: 'TRIPLE CHERRY', isJackpot: false };
      case 'SKULL':
        return { multiplier: 0, label: 'CURSED SKULLS', isJackpot: false };
    }
  }

  const counts: Record<SlotSymbol, number> = {
    CHERRY: 0,
    COIN: 0,
    STAR: 0,
    SKULL: 0,
    SEVEN: 0,
  };
  counts[a]++;
  counts[b]++;
  counts[c]++;

  if (counts.SEVEN === 2) {
    return { multiplier: 2.5, label: 'DOUBLE SEVEN', isJackpot: false };
  }
  if (counts.STAR === 2 || counts.COIN === 2) {
    return {
      multiplier: 1.5,
      label: counts.STAR === 2 ? 'PAIR OF STARS' : 'PAIR OF COINS',
      isJackpot: false,
    };
  }

  return { multiplier: 0, label: 'NO MATCH', isJackpot: false };
}

/* ---------------- DICE ---------------- */
export type DiceMode = 'OVER' | 'UNDER';

export function calculateDiceWinChance(target: number, mode: DiceMode): number {
  const clamped = Math.max(5, Math.min(95, Math.round(target)));
  // Roll range is integer 1..100
  if (mode === 'OVER') {
    return 100 - clamped;
  }
  return clamped - 1;
}

export function calculateDiceMultiplier(target: number, mode: DiceMode): number {
  const chance = calculateDiceWinChance(target, mode);
  if (chance <= 0) return 0;
  return Math.max(1.01, Math.floor((97 / chance) * 100) / 100);
}

export function rollDiceValue(rng: RngFn = Math.random): number {
  return Math.floor(rng() * 100) + 1;
}

export function evaluateDiceRoll(
  roll: number,
  target: number,
  mode: DiceMode
): boolean {
  if (mode === 'OVER') return roll > target;
  return roll < target;
}

/* ---------------- CRASH ---------------- */
export function generateCrashPoint(rng: RngFn = Math.random): number {
  const r = Math.min(0.9999, Math.max(0, rng()));
  if (r < 0.03) return 1.0;
  const raw = 0.97 / (1 - r);
  return Math.min(100, Math.max(1.0, Math.floor(raw * 100) / 100));
}

export function crashMultiplierAtElapsed(elapsedMs: number): number {
  if (elapsedMs <= 0) return 1.0;
  const val = Math.exp(0.000085 * elapsedMs);
  return Math.floor(val * 100) / 100;
}

/* ---------------- LUCKY WHEEL ---------------- */
export interface WheelSegment {
  multiplier: number;
  label: string;
  tier: 'zero' | 'low' | 'mid' | 'high' | 'jackpot';
}

// 20 segments: 10 + 3 + 1.5*2 + 1.2 + 0.5*4 = 19.2 / 20 = 0.96 EV
export const WHEEL_SEGMENTS: WheelSegment[] = [
  { multiplier: 10, label: '10X', tier: 'jackpot' },
  { multiplier: 0, label: '0X', tier: 'zero' },
  { multiplier: 0.5, label: '0.5X', tier: 'low' },
  { multiplier: 0, label: '0X', tier: 'zero' },
  { multiplier: 1.5, label: '1.5X', tier: 'mid' },
  { multiplier: 0, label: '0X', tier: 'zero' },
  { multiplier: 0.5, label: '0.5X', tier: 'low' },
  { multiplier: 0, label: '0X', tier: 'zero' },
  { multiplier: 3, label: '3X', tier: 'high' },
  { multiplier: 0, label: '0X', tier: 'zero' },
  { multiplier: 1.2, label: '1.2X', tier: 'mid' },
  { multiplier: 0, label: '0X', tier: 'zero' },
  { multiplier: 0.5, label: '0.5X', tier: 'low' },
  { multiplier: 0, label: '0X', tier: 'zero' },
  { multiplier: 1.5, label: '1.5X', tier: 'mid' },
  { multiplier: 0, label: '0X', tier: 'zero' },
  { multiplier: 0.5, label: '0.5X', tier: 'low' },
  { multiplier: 0, label: '0X', tier: 'zero' },
  { multiplier: 0, label: '0X', tier: 'zero' },
  { multiplier: 0, label: '0X', tier: 'zero' },
];

export function spinWheelIndex(rng: RngFn = Math.random): number {
  return Math.floor(rng() * WHEEL_SEGMENTS.length);
}

/* ---------------- TOWER ---------------- */
export type TowerDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export const TOWER_FLOORS = 8;

export function getTowerConfig(difficulty: TowerDifficulty): {
  cols: number;
  trapsPerFloor: number;
} {
  switch (difficulty) {
    case 'EASY':
      return { cols: 4, trapsPerFloor: 1 };
    case 'NORMAL':
      return { cols: 3, trapsPerFloor: 1 };
    case 'HARD':
      return { cols: 2, trapsPerFloor: 1 };
  }
}

export function calculateTowerMultiplier(
  clearedFloors: number,
  difficulty: TowerDifficulty
): number {
  if (clearedFloors <= 0) return 1.0;
  const { cols, trapsPerFloor } = getTowerConfig(difficulty);
  const stepRatio = cols / (cols - trapsPerFloor);
  const raw = Math.pow(stepRatio, clearedFloors) * 0.97;
  return Math.max(1.01, Math.floor(raw * 100) / 100);
}

export function generateTowerFloor(
  difficulty: TowerDifficulty,
  rng: RngFn = Math.random
): boolean[] {
  const { cols, trapsPerFloor } = getTowerConfig(difficulty);
  const traps = Array<boolean>(cols).fill(false);
  const indices = Array.from({ length: cols }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  for (let i = 0; i < trapsPerFloor; i++) {
    traps[indices[i]] = true;
  }
  return traps;
}

/* ---------------- COIN FLIP ---------------- */
export type CoinSide = 'HEADS' | 'TAILS';

export const COINFLIP_MAX_STREAK = 10;

export function calculateCoinFlipMultiplier(streak: number): number {
  if (streak <= 0) return 1.0;
  const clamped = Math.min(COINFLIP_MAX_STREAK, Math.floor(streak));
  return Math.floor(Math.pow(1.96, clamped) * 100) / 100;
}

export function flipCoinSide(rng: RngFn = Math.random): CoinSide {
  return rng() < 0.5 ? 'HEADS' : 'TAILS';
}

/* ---------------- SHELL SHUFFLE ---------------- */
export const CUPS_MULTIPLIER = 2.85;
export type CupIndex = 0 | 1 | 2;
export type CupSwapPair = [CupIndex, CupIndex];

const VALID_SWAP_PAIRS: CupSwapPair[] = [
  [0, 1],
  [1, 2],
  [0, 2],
];

export function generateCupSwaps(
  steps: number = 5,
  rng: RngFn = Math.random
): CupSwapPair[] {
  const safeSteps = Math.max(1, Math.floor(steps));
  const swaps: CupSwapPair[] = [];
  let prevIdx = -1;
  for (let i = 0; i < safeSteps; i++) {
    let idx = Math.floor(rng() * VALID_SWAP_PAIRS.length);
    if (idx === prevIdx) {
      idx = (idx + 1) % VALID_SWAP_PAIRS.length;
    }
    prevIdx = idx;
    swaps.push(VALID_SWAP_PAIRS[idx]);
  }
  return swaps;
}

export function simulateCupOrder(
  initialCoinCup: CupIndex,
  swaps: CupSwapPair[]
): { slots: [number, number, number]; coinSlot: CupIndex } {
  const slots: [number, number, number] = [0, 1, 2];
  for (const [a, b] of swaps) {
    const temp = slots[a];
    slots[a] = slots[b];
    slots[b] = temp;
  }
  const coinSlot = slots.indexOf(initialCoinCup) as CupIndex;
  return { slots, coinSlot };
}

/* ---------------- PIXEL KENO ---------------- */
export const KENO_BOARD_SIZE = 40;
export const KENO_DRAW_COUNT = 10;
export const KENO_MAX_PICKS = 8;

export const KENO_PAYOUT_TABLE: Record<number, Record<number, number>> = {
  1: { 0: 0, 1: 3.8 },
  2: { 0: 0, 1: 1.1, 2: 9 },
  3: { 0: 0, 1: 0.5, 2: 2.5, 3: 32 },
  4: { 0: 0, 1: 0, 2: 1.8, 3: 8, 4: 90 },
  5: { 0: 0, 1: 0, 2: 1.0, 3: 4, 4: 22, 5: 250 },
  6: { 0: 0, 1: 0, 2: 0, 3: 3, 4: 12, 5: 90, 6: 500 },
  7: { 0: 0, 1: 0, 2: 0, 3: 1.8, 4: 6.5, 5: 35, 6: 200, 7: 750 },
  8: { 0: 0, 1: 0, 2: 0, 3: 1.2, 4: 4, 5: 18, 6: 90, 7: 400, 8: 1000 },
};

export function getKenoMultiplier(
  picksCount: number,
  hitsCount: number
): number {
  const table = KENO_PAYOUT_TABLE[picksCount];
  if (!table) return 0;
  return table[hitsCount] ?? 0;
}

export function getKenoPaytableForPicks(
  picksCount: number
): Array<{ hits: number; multiplier: number }> {
  const table = KENO_PAYOUT_TABLE[picksCount];
  if (!table) return [];
  return Object.entries(table)
    .map(([hits, multiplier]) => ({
      hits: Number(hits),
      multiplier,
    }))
    .filter((row) => row.multiplier > 0);
}

export function drawKenoNumbers(
  count: number = KENO_DRAW_COUNT,
  boardSize: number = KENO_BOARD_SIZE,
  rng: RngFn = Math.random
): number[] {
  const safeCount = Math.max(1, Math.min(boardSize, Math.floor(count)));
  const pool = Array.from({ length: boardSize }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, safeCount);
}

export function generateKenoQuickPick(
  count: number = 5,
  boardSize: number = KENO_BOARD_SIZE,
  rng: RngFn = Math.random
): number[] {
  const safeCount = Math.max(1, Math.min(KENO_MAX_PICKS, Math.floor(count)));
  return drawKenoNumbers(safeCount, boardSize, rng).sort((a, b) => a - b);
}

