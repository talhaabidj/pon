/**
 * Currency — Shared formatting helpers for Catchapon's in-game economy.
 */

export const CATCHAPON_CURRENCY_NAME = 'Catcha Credits';
export const CATCHAPON_CURRENCY_CODE = 'CC';

function toWholeUnits(amount: number): number {
  return Math.round(amount);
}

/** Format a value in Catchapon currency. Example: "CC 120" */
export function formatCurrency(amount: number): string {
  const whole = toWholeUnits(amount);
  return `${CATCHAPON_CURRENCY_CODE} ${whole.toLocaleString('en-US')}`;
}

/** Format a signed delta for reward/penalty messages. Example: "+CC 18" */
export function formatCurrencyDelta(amount: number): string {
  const whole = toWholeUnits(amount);
  const sign = whole >= 0 ? '+' : '-';
  const absolute = Math.abs(whole);
  return `${sign}${CATCHAPON_CURRENCY_CODE} ${absolute.toLocaleString('en-US')}`;
}
