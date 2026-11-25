import React from 'react';
import { BAILOUT_AMOUNT, canClaimBailout, validateBet } from '../engine/economy';
import { soundEngine } from '../audio/soundEngine';

interface BetBarProps {
  bet: number;
  balance: number;
  disabled?: boolean;
  onChangeBet: (next: number) => void;
  onClaimBailout: () => void;
}

export const BetBar: React.FC<BetBarProps> = ({
  bet,
  balance,
  disabled = false,
  onChangeBet,
  onClaimBailout,
}) => {
  const check = validateBet(bet, balance);
  const needsBailout = canClaimBailout(balance);

  const setSafeBet = (value: number) => {
    soundEngine.click();
    const clamped = Math.max(1, Math.min(Math.max(1, balance), Math.round(value)));
    onChangeBet(clamped);
  };

  return (
    <div className="lcd-panel p-3 sm:p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor="bet-amount-input"
          className="font-pixel text-xs md:text-sm text-[var(--ink-muted)] tracking-wide"
        >
          WAGER (ZC)
        </label>
        <div className="flex items-center gap-1.5">
          {[10, 50, 100].map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={disabled || balance < preset}
              onClick={() => setSafeBet(preset)}
              className="pixel-btn bg-[var(--bg-screen)] px-2.5 py-1 font-pixel text-xs text-[var(--ink-primary)] tabular-nums"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          id="bet-amount-input"
          type="number"
          min={1}
          max={Math.max(1, balance)}
          step={1}
          disabled={disabled}
          value={bet}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onChangeBet(Number.isNaN(val) ? 0 : val);
          }}
          className="w-28 sm:w-32 bg-[var(--bg-screen)] border-2 border-[var(--border-lcd)] px-3 py-2 font-pixel text-sm md:text-base text-[var(--ink-primary)] tabular-nums focus:outline-none focus:border-[var(--accent)] disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            disabled={disabled || balance < 1}
            onClick={() => setSafeBet(1)}
            className="pixel-btn bg-[var(--bg-screen)] px-2.5 py-2 font-pixel text-xs text-[var(--ink-primary)]"
          >
            MIN
          </button>
          <button
            type="button"
            disabled={disabled || balance < 1}
            onClick={() => setSafeBet(Math.max(1, Math.floor(bet / 2)))}
            className="pixel-btn bg-[var(--bg-screen)] px-2.5 py-2 font-pixel text-xs text-[var(--ink-primary)]"
          >
            1/2
          </button>
          <button
            type="button"
            disabled={disabled || balance < 1}
            onClick={() => setSafeBet(Math.min(balance, Math.max(1, bet * 2)))}
            className="pixel-btn bg-[var(--bg-screen)] px-2.5 py-2 font-pixel text-xs text-[var(--ink-primary)]"
          >
            2X
          </button>
          <button
            type="button"
            disabled={disabled || balance < 1}
            onClick={() => setSafeBet(balance)}
            className="pixel-btn bg-[var(--bg-screen)] px-2.5 py-2 font-pixel text-xs text-[var(--ink-primary)]"
          >
            MAX
          </button>
        </div>
      </div>

      {needsBailout ? (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border-lcd)]">
          <span className="font-mono-body text-xs text-[var(--ink-primary)]">
            Balance empty. Claim free recovery coins.
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={onClaimBailout}
            className="pixel-btn-primary px-3 py-1.5 font-pixel text-xs whitespace-nowrap"
          >
            FREE +{BAILOUT_AMOUNT} ZC
          </button>
        </div>
      ) : !check.valid ? (
        <p className="font-mono-body text-xs text-[var(--ink-primary)]">
          ! {check.reason}
        </p>
      ) : null}
    </div>
  );
};
