// What the buyer pays, and when (PRD §3.2, decisions D5 and D7).
//
// Path A, mockup first:  mockup fee → advance (minus the fee) → balance + shipping
// Path B, direct order:  advance → balance + shipping
//
// The mockup fee is credited against the advance. If the fee is bigger than
// the advance, the rest of the credit comes off the balance. Either way the
// buyer pays exactly item total + shipping in the end.

import { percent, percentOf, rupees, type Paise } from "./money";

export type CheckoutPath = "MOCKUP_FIRST" | "DIRECT";

export const MOCKUP_FEE_MIN_PAISE = rupees(99);
export const MOCKUP_FEE_MAX_PAISE = rupees(199);

/** The creator chooses the advance within this range (D7). 60% keeps the balance big enough to cover fees. */
export const ADVANCE_PERCENT_MIN = 20;
export const ADVANCE_PERCENT_MAX = 60;
export const ADVANCE_PERCENT_DEFAULT = 50;

export interface PaymentPlanInput {
  itemTotalPaise: Paise;
  advancePercent: number;
  path: CheckoutPath;
  /** The product's mockup fee; required for MOCKUP_FIRST, ignored for DIRECT. */
  mockupFeePaise?: Paise | null;
  /** Shipping quote. Estimated at checkout, re-quoted when the gift is ready to ship. */
  shippingPaise?: Paise;
}

export interface PaymentPlan {
  path: CheckoutPath;
  itemTotalPaise: Paise;
  /** Milestone 0 (Path A only). */
  mockupPaise: Paise;
  /** item total × advance %, before the mockup credit. */
  advanceGrossPaise: Paise;
  /** Milestone 1: what the buyer actually pays as the advance. */
  advanceDuePaise: Paise;
  /** The item part of milestone 2 (excluding shipping). */
  balanceItemPaise: Paise;
  shippingPaise: Paise;
  /** Milestone 2: balance item part + shipping. */
  balanceDuePaise: Paise;
  /** Everything the buyer pays across all milestones. */
  buyerTotalPaise: Paise;
}

export function calculatePaymentPlan(input: PaymentPlanInput): PaymentPlan {
  const { itemTotalPaise, advancePercent, path } = input;
  const shippingPaise = input.shippingPaise ?? 0;

  if (!Number.isSafeInteger(itemTotalPaise) || itemTotalPaise <= 0) {
    throw new RangeError("Item total must be a positive whole number of paise.");
  }
  if (!Number.isSafeInteger(shippingPaise) || shippingPaise < 0) {
    throw new RangeError("Shipping must be a whole, non-negative number of paise.");
  }
  if (!isValidAdvancePercent(advancePercent)) {
    throw new RangeError(`Advance must be ${ADVANCE_PERCENT_MIN}–${ADVANCE_PERCENT_MAX}%.`);
  }

  let mockupPaise = 0;
  if (path === "MOCKUP_FIRST") {
    const fee = input.mockupFeePaise;
    if (fee === null || fee === undefined) throw new RangeError("This product has no paid mockup.");
    if (!isValidMockupFee(fee)) throw new RangeError("Mockup fee must be ₹99–₹199.");
    if (fee > itemTotalPaise) throw new RangeError("Mockup fee can't exceed the item total.");
    mockupPaise = fee;
  }

  const advanceGrossPaise = percentOf(itemTotalPaise, percent(advancePercent));
  const creditOnAdvance = Math.min(mockupPaise, advanceGrossPaise);
  const advanceDuePaise = advanceGrossPaise - creditOnAdvance;
  const creditOnBalance = mockupPaise - creditOnAdvance;
  const balanceItemPaise = itemTotalPaise - advanceGrossPaise - creditOnBalance;
  const balanceDuePaise = balanceItemPaise + shippingPaise;

  return {
    path,
    itemTotalPaise,
    mockupPaise,
    advanceGrossPaise,
    advanceDuePaise,
    balanceItemPaise,
    shippingPaise,
    balanceDuePaise,
    buyerTotalPaise: mockupPaise + advanceDuePaise + balanceDuePaise,
  };
}

export function isValidAdvancePercent(value: number): boolean {
  return Number.isInteger(value) && value >= ADVANCE_PERCENT_MIN && value <= ADVANCE_PERCENT_MAX;
}

export function isValidMockupFee(paise: Paise): boolean {
  return Number.isSafeInteger(paise) && paise >= MOCKUP_FEE_MIN_PAISE && paise <= MOCKUP_FEE_MAX_PAISE;
}
