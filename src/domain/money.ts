// Money is always an integer number of paise (₹1 = 100 paise).
//
// Why: Phase 1 takes percentages of prices (advance, commission, GST, TCS,
// TDS), which produce fractions of a rupee (50% of ₹1,199 = ₹599.50).
// Whole rupees can't hold those, and decimals in JavaScript drift
// (0.1 + 0.2 !== 0.3). Integers are exact, and Razorpay works in paise too.
// People still see and type rupees: convert with rupees() on the way in and
// formatINR() (src/lib/format.ts) on the way out.

/** An amount in paise. Always a safe integer. */
export type Paise = number;

/** A rate in basis points: 1% = 100 bps, 18% = 1800 bps, 0.5% = 50 bps. */
export type BasisPoints = number;

export const PAISE_PER_RUPEE = 100;

/** ₹ amount (as typed by a person) → paise. rupees(1199) = 119900; rupees(599.5) = 59950. */
export function rupees(amount: number): Paise {
  if (!Number.isFinite(amount)) throw new RangeError(`Not a rupee amount: ${amount}`);
  return Math.round(amount * PAISE_PER_RUPEE);
}

export function isPaise(value: unknown): value is Paise {
  return typeof value === "number" && Number.isSafeInteger(value);
}

/** Percent as typed by a person (50, 2.5) → basis points (5000, 250). */
export function percent(value: number): BasisPoints {
  return Math.round(value * 100);
}

/**
 * `amount × rate`, rounded half-up to the nearest paisa (half away from zero
 * for negative amounts). The one rounding rule used everywhere, so every
 * calculation can be repeated exactly.
 *
 * percentOf(119900, 5000) = 59950   (50% of ₹1,199 = ₹599.50)
 * percentOf(9255, 1800)   = 1666    (18% of ₹92.55 = ₹16.659 → ₹16.66)
 */
export function percentOf(amount: Paise, rate: BasisPoints): Paise {
  assertPaise(amount);
  if (!Number.isSafeInteger(rate) || rate < 0) throw new RangeError(`Invalid rate: ${rate} bps`);
  const product = Math.abs(amount) * rate;
  if (!Number.isSafeInteger(product)) throw new RangeError("Amount too large");
  const rounded = Math.floor((product + 5_000) / 10_000);
  return amount < 0 ? -rounded : rounded;
}

/** Sum of paise amounts, checked. */
export function sum(amounts: Paise[]): Paise {
  return amounts.reduce((total, amount) => {
    assertPaise(amount);
    return total + amount;
  }, 0);
}

export function assertPaise(value: number): asserts value is Paise {
  if (!isPaise(value)) throw new RangeError(`Not a whole number of paise: ${value}`);
}
