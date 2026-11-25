import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BAILOUT_AMOUNT,
  CHEAT_COINS_AMOUNT,
  DAILY_REWARD_COOLDOWN_MS,
  GAMES_CATALOG,
  STARTING_BALANCE,
  applyCheatCoins,
  canClaimBailout,
  canClaimDaily,
  createInitialArcadeState,
  getLevelFromXp,
  getMostPlayedGame,
  settleRound,
  validateBet,
} from './economy';
import {
  COINFLIP_MAX_STREAK,
  CUPS_MULTIPLIER,
  KENO_BOARD_SIZE,
  KENO_DRAW_COUNT,
  MINES_GRID_SIZE,
  PLINKO_MULTIPLIERS,
  WHEEL_SEGMENTS,
  calculateCoinFlipMultiplier,
  calculateDiceMultiplier,
  calculateDiceWinChance,
  calculateMinesMultiplier,
  calculatePayout,
  calculateTowerMultiplier,
  crashMultiplierAtElapsed,
  drawKenoNumbers,
  evaluateDiceRoll,
  evaluateSlotsSpin,
  flipCoinSide,
  generateCrashPoint,
  generateCupSwaps,
  generateKenoQuickPick,
  generateMinesBoard,
  generateTowerFloor,
  getKenoMultiplier,
  getKenoPaytableForPicks,
  getPlinkoMultiplierForSlot,
  simulateCupOrder,
} from './gamesMath';

test('bet validation rejects invalid, zero, negative, and over-balance bets', () => {
  assert.equal(validateBet(100, 1000).valid, true);
  assert.equal(validateBet(1000, 1000).valid, true);
  assert.equal(validateBet(0, 1000).valid, false);
  assert.equal(validateBet(-10, 1000).valid, false);
  assert.equal(validateBet(1001, 1000).valid, false);
  assert.equal(validateBet(12.5, 1000).valid, false);
});

test('round settlement updates balance, streaks, XP, and achievements accurately', () => {
  let state = createInitialArcadeState();
  assert.equal(state.balance, STARTING_BALANCE);

  // Deduct bet before settlement (as games do on round start)
  state = { ...state, balance: state.balance - 100 };
  const winRound = settleRound(state, {
    gameId: 'dice',
    gameName: 'DICE',
    bet: 100,
    payout: 650,
    multiplier: 6.5,
    timestamp: 1000,
    id: 'r1',
  });

  state = winRound.nextState;
  assert.equal(state.balance, 1550);
  assert.equal(state.stats.gamesPlayed, 1);
  assert.equal(state.stats.wins, 1);
  assert.equal(state.stats.currentWinStreak, 1);
  assert.equal(state.stats.totalWon, 550);
  assert.equal(state.stats.biggestWin, 550);
  assert.ok(winRound.newlyUnlocked.includes('first_blood'));
  assert.ok(winRound.newlyUnlocked.includes('house_broken'));
  assert.equal(getMostPlayedGame(state.stats.playCounts), 'DICE');
});

test('losing 10 rounds consecutively unlocks PROFESSIONAL LOSER', () => {
  let state = createInitialArcadeState();
  for (let i = 0; i < 10; i++) {
    state = { ...state, balance: state.balance - 10 };
    state = settleRound(state, {
      gameId: 'slots',
      gameName: 'PIXEL SLOTS',
      bet: 10,
      payout: 0,
      multiplier: 0,
      timestamp: 2000 + i,
      id: `loss-${i}`,
    }).nextState;
  }
  assert.equal(state.stats.currentLossStreak, 10);
  assert.equal(state.stats.totalLost, 100);
  assert.ok(state.unlockedAchievements.includes('professional_loser'));
});

test('daily reward cooldown and bailout rules', () => {
  const now = 1_700_000_000_000;
  assert.equal(canClaimDaily(null, now), true);
  assert.equal(canClaimDaily(now - 1000, now), false);
  assert.equal(canClaimDaily(now - DAILY_REWARD_COOLDOWN_MS, now), true);

  assert.equal(canClaimBailout(0), true);
  assert.equal(canClaimBailout(1), false);
  assert.equal(BAILOUT_AMOUNT, 500);
});

test('XP leveling progresses smoothly', () => {
  const lvl1 = getLevelFromXp(0);
  assert.equal(lvl1.level, 1);
  assert.equal(lvl1.nextLevelXp, 100);

  const lvl2 = getLevelFromXp(100);
  assert.equal(lvl2.level, 2);
  assert.equal(lvl2.currentXp, 0);
  assert.equal(lvl2.nextLevelXp, 150);
});

test('mines math generates exact mine count and increasing multipliers', () => {
  const board = generateMinesBoard(5, () => 0.42);
  assert.equal(board.length, MINES_GRID_SIZE);
  assert.equal(board.filter(Boolean).length, 5);

  const m1 = calculateMinesMultiplier(1, 5);
  const m2 = calculateMinesMultiplier(2, 5);
  const m5 = calculateMinesMultiplier(5, 5);
  assert.ok(m1 > 1);
  assert.ok(m2 > m1);
  assert.ok(m5 > m2);
});

test('dice probability & payout math is consistent', () => {
  assert.equal(calculateDiceWinChance(50, 'OVER'), 50);
  assert.equal(calculateDiceWinChance(50, 'UNDER'), 49);
  assert.equal(calculateDiceMultiplier(50, 'OVER'), 1.94);
  assert.equal(evaluateDiceRoll(51, 50, 'OVER'), true);
  assert.equal(evaluateDiceRoll(50, 50, 'OVER'), false);
  assert.equal(evaluateDiceRoll(49, 50, 'UNDER'), true);
});

test('slots evaluation catches jackpots, pairs, and cursed skulls', () => {
  const jackpot = evaluateSlotsSpin(['SEVEN', 'SEVEN', 'SEVEN']);
  assert.equal(jackpot.multiplier, 25);
  assert.equal(jackpot.isJackpot, true);

  const skulls = evaluateSlotsSpin(['SKULL', 'SKULL', 'SKULL']);
  assert.equal(skulls.multiplier, 0);

  const pair7 = evaluateSlotsSpin(['SEVEN', 'CHERRY', 'SEVEN']);
  assert.equal(pair7.multiplier, 2.5);
});

test('crash point and growth curve behave deterministically', () => {
  assert.equal(generateCrashPoint(() => 0.01), 1.0);
  assert.ok(generateCrashPoint(() => 0.5) >= 1.9);
  assert.equal(crashMultiplierAtElapsed(0), 1.0);
  assert.ok(crashMultiplierAtElapsed(5000) > 1.4);
});

test('plinko, wheel, and tower math maintain valid bounds', () => {
  assert.equal(getPlinkoMultiplierForSlot(0), PLINKO_MULTIPLIERS[0]);
  assert.equal(getPlinkoMultiplierForSlot(99), PLINKO_MULTIPLIERS[PLINKO_MULTIPLIERS.length - 1]);

  const wheelEv =
    WHEEL_SEGMENTS.reduce((sum, s) => sum + s.multiplier, 0) /
    WHEEL_SEGMENTS.length;
  assert.ok(wheelEv > 0.9 && wheelEv < 1.0);

  const floor = generateTowerFloor('NORMAL', () => 0.3);
  assert.equal(floor.length, 3);
  assert.equal(floor.filter(Boolean).length, 1);

  assert.ok(
    calculateTowerMultiplier(3, 'HARD') > calculateTowerMultiplier(3, 'NORMAL')
  );
  assert.ok(
    calculateTowerMultiplier(3, 'NORMAL') > calculateTowerMultiplier(3, 'EASY')
  );
});

test('cheat coins adds +10 ZC cleanly without altering stats', () => {
  const initial = createInitialArcadeState();
  const next = applyCheatCoins(initial);
  assert.equal(CHEAT_COINS_AMOUNT, 10);
  assert.equal(next.balance, STARTING_BALANCE + 10);
  assert.equal(next.stats.gamesPlayed, 0);
});

test('coin flip streak multipliers and flip outcomes behave accurately', () => {
  assert.equal(calculateCoinFlipMultiplier(0), 1.0);
  assert.equal(calculateCoinFlipMultiplier(1), 1.96);
  assert.equal(calculateCoinFlipMultiplier(2), 3.84);
  assert.ok(
    calculateCoinFlipMultiplier(COINFLIP_MAX_STREAK) >
      calculateCoinFlipMultiplier(5)
  );
  assert.equal(flipCoinSide(() => 0.2), 'HEADS');
  assert.equal(flipCoinSide(() => 0.8), 'TAILS');
});

test('shell shuffle cup swaps conserve all cups and track the coin accurately', () => {
  assert.equal(CUPS_MULTIPLIER, 2.85);
  const swaps = generateCupSwaps(5, () => 0.5);
  assert.equal(swaps.length, 5);

  const first = simulateCupOrder(1, [
    [0, 1],
    [1, 2],
  ]);
  assert.deepEqual([...first.slots].sort(), [0, 1, 2]);
  assert.equal(first.slots[first.coinSlot], 1);
  assert.equal(first.coinSlot, 0);

  const second = simulateCupOrder(1, [
    [0, 1],
    [0, 2],
  ]);
  assert.equal(second.coinSlot, 2);
});

test('pixel keno draws unique numbers and pays valid hit multipliers', () => {
  assert.equal(GAMES_CATALOG.length, 10);

  const draw = drawKenoNumbers(KENO_DRAW_COUNT, KENO_BOARD_SIZE);
  assert.equal(draw.length, 10);
  assert.equal(new Set(draw).size, 10);
  assert.ok(draw.every((n) => n >= 1 && n <= KENO_BOARD_SIZE));

  const quick = generateKenoQuickPick(6);
  assert.equal(quick.length, 6);
  assert.equal(new Set(quick).size, 6);

  assert.equal(getKenoMultiplier(5, 0), 0);
  assert.equal(getKenoMultiplier(5, 3), 4);
  assert.equal(getKenoMultiplier(8, 8), 1000);
  assert.ok(getKenoPaytableForPicks(5).length >= 4);
});

test('calculatePayout floors small bets cleanly and avoids float truncation', () => {
  // Exact decimal precision (e.g. IEEE-754 100 * 1.15 === 114.99999999999999)
  assert.equal(calculatePayout(100, 1.15), 115);
  assert.equal(calculatePayout(100, 2.05), 205);
  assert.equal(calculatePayout(100, 4.1), 410);

  // Small bets cannot round up into >100% EV
  assert.equal(calculatePayout(1, 0.5), 0);
  assert.equal(calculatePayout(1, 0.6), 0);
  assert.equal(calculatePayout(1, 1.51), 1);
  assert.equal(calculatePayout(3, 2.5), 7);

  // Verify Dice & Wheel never exceed 100% RTP on 1-3 ZC bets
  for (const smallBet of [1, 2, 3]) {
    for (let target = 5; target <= 95; target++) {
      for (const mode of ['OVER', 'UNDER'] as const) {
        const chance = calculateDiceWinChance(target, mode);
        const mult = calculateDiceMultiplier(target, mode);
        const rtp = ((chance / 100) * calculatePayout(smallBet, mult)) / smallBet;
        assert.ok(rtp <= 1.0, `Dice RTP ${rtp} exceeded 1.0 at bet=${smallBet}`);
      }
    }
    const wheelRtp =
      WHEEL_SEGMENTS.reduce(
        (sum, seg) => sum + calculatePayout(smallBet, seg.multiplier),
        0
      ) /
      (WHEEL_SEGMENTS.length * smallBet);
    assert.ok(wheelRtp < 1.0, `Wheel RTP ${wheelRtp} must stay < 1.0`);
  }
});
