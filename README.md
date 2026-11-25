<div align="center">

# JUSTONEMORE

**A retro handheld arcade gambling simulator built in Game Boy LCD monochrome & DMG-01 green.**  
Ten deterministic mini-games, procedural 8-bit chiptune audio, local coin progression, and zero real-money stakes.

<p>
  <img src="https://img.shields.io/badge/React-19-081208?style=flat-square&logo=react&logoColor=a8e016&labelColor=163316&color=386b28" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-7-081208?style=flat-square&logo=typescript&logoColor=a8e016&labelColor=163316&color=386b28" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-081208?style=flat-square&logo=vite&logoColor=a8e016&labelColor=163316&color=386b28" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-081208?style=flat-square&logo=tailwindcss&logoColor=a8e016&labelColor=163316&color=386b28" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/HTML5-Canvas-081208?style=flat-square&logo=html5&logoColor=a8e016&labelColor=163316&color=386b28" alt="HTML5 Canvas" />
  <img src="https://img.shields.io/badge/Audio-Web_Audio_API-081208?style=flat-square&labelColor=163316&color=386b28" alt="Web Audio API" />
  <img src="https://img.shields.io/badge/Icons-Lucide_%2B_Pixel_SVG-081208?style=flat-square&labelColor=163316&color=386b28" alt="Lucide and Pixel SVG" />
</p>

</div>

---

## :: CARTRIDGE BAY (10 MINI-GAMES)

Every game runs on pure virtual **ZERO COINS (`ZC`)** with unified floored integer payout math (`calculatePayout`) and transparent odds.

| SLOT | TITLE | GAMEPLAY | TOP PAYOUT |
| :--- | :--- | :--- | :--- |
| `01` | **MINES** | Uncover safe tiles across a `5×5` grid with `1–24` hidden bombs; cash out anytime. | Dynamic combinatoric odds |
| `02` | **PLINKO** | Real-time 2D Canvas pegboard physics across 10 rows into 11 multiplier buckets. | `16X` |
| `03` | **PIXEL SLOTS** | 3-reel weighted pixel symbol spinner with triples, pair bonuses, and cursed skulls. | `25X` (`7-7-7`) |
| `04` | **DICE** | Pick a `5–95` target and predict `ROLL OVER` or `ROLL UNDER` on a `1–100` roll. | `24.25X` |
| `05` | **CRASH** | Ride an exponential rocket curve and bail (`Click` or `Space`) before boom. | `100X` |
| `06` | **LUCKY WHEEL** | 20-wedge spinning prize wheel with smooth deceleration and tick audio. | `10X` |
| `07` | **TOWER** | Climb 8 trap-guarded floors across `EASY` (4 cols), `NORMAL` (3 cols), and `HARD` (2 cols). | `248.32X` (`HARD` F8) |
| `08` | **COIN FLIP** | Call Heads or Tails to chain a double-or-nothing streak (`QUICK PLAY` supported). | `839.29X` (10 streak) |
| `09` | **SHELL SHUFFLE** | Track the hidden coin across animated 3-cup swaps (`QUICK PLAY` supported). | `2.85X` |
| `10` | **PIXEL KENO** | Mark `1–8` numbers on a 40-cell grid and match a 10-ball draw (`QUICK PICK` & `QUICK PLAY`). | `1000X` (`8/8` hits) |

---

## :: HARDWARE & SYSTEM FEATURES

- **Dual LCD Themes**: Switch live between **Game Boy Green (`GREEN`)** and **Monochrome (`B&W`)** palettes across UI panels, pixel SVGs, and `<canvas>` games.
- **CRT Hardware Effects**: Toggleable **CRT scanlines**, subtle **LCD screen flicker**, and hidden scrollbars for a clean full-width handheld viewport.
- **Procedural Chiptune Audio Engine**: Custom `Web Audio API` synthesizer generating boot chimes, peg bounces, slot reel stops, coin flips, cup slides, keno blips, and explosions with zero external audio assets.
- **Tumbling Dice Transitions**: Center-screen pixel isometric dice animation plays between screens and respects `prefers-reduced-motion`.
- **Virtual Coin Economy (`ZC`)**:
  - Starts at `1,000 ZC` with `localStorage` persistence.
  - **`+250 ZC` Daily Drop** every 24 hours.
  - **`+500 ZC` Bailout** automatically available whenever your balance hits `0 ZC`.
  - **Secret Arcade Cheat**: Tap or click the balance badge **3 times** quickly for `+10 ZC`.
- **Player Record & Ledger**:
  - XP & leveling progression bar, win/loss streaks, lifetime won/lost totals, and favorite game tracking.
  - **8 Unlockable Achievements** (`FIRST BLOOD`, `LUCKY BASTARD`, `HOUSE BROKEN`, `PROFESSIONAL LOSER`, `ONE MORE ROUND`, `ABSOLUTE CINEMA`, `ZEROED OUT`, `DIAMOND HANDS`).
  - **Game History** screen storing up to 200 recent rounds with game and `WIN`/`LOSS` filters.

---

## :: TECH & ARCHITECTURE

| LAYER | IMPLEMENTATION |
| :--- | :--- |
| **UI & Styling** | React 19 + Tailwind CSS v4 with CSS custom property theme tokens (`Silkscreen` + `IBM Plex Mono`) |
| **Canvas Games** | Custom `requestAnimationFrame` loops for Plinko physics, Crash flight path, and Lucky Wheel rotation |
| **Game Math & Economy** | Decoupled pure TypeScript engine (`src/engine/gamesMath.ts`, `src/engine/economy.ts`) |
| **State Persistence** | `useArcadeStore` hook backed by `localStorage` with synchronous ref-guarded bet deductions |
| **Audio** | `RetroSoundEngine` (`src/audio/soundEngine.ts`) using Web Audio oscillators and filtered noise |
| **Unit Testing** | `node:test` + `assert/strict` suite covering bet validation, RTP bounds, shuffles, and payout math |

---

<div align="center">

*JUSTONEMORE is a free-to-play parody arcade simulator. ZERO COINS have zero real-world value.*

</div>
