// Who gets what from an order (PRD §6, decisions D6, D8, D9, D15, D16).
//
// Money reaches the creator when it becomes non-refundable:
//   mockup fee  → when the first mockup is uploaded
//   advance     → when the creator starts production
//   balance     → after the dispute window, minus the platform's fees and taxes
// Commission, GST, TCS and TDS all come out of the balance, because the
// earlier payments have already been released.
//
// ⚠ Tax rates and bases are planning assumptions. Confirm with a CA (Q12).

import { addDays } from "@/lib/dates";
import { percentOf, type BasisPoints, type Paise } from "./money";
import type { PaymentPlan } from "./payment-plan";

/** PRD §6: 5–8% for creator bio-link orders. */
export const COMMISSION_BPS_MIN: BasisPoints = 500;
export const COMMISSION_BPS_MAX: BasisPoints = 800;
/** PRD §6: 0% commission for a creator's first 30 days. */
export const COMMISSION_PROMO_DAYS = 30;
/** 18% GST on the platform's commission. */
export const GST_ON_COMMISSION_BPS: BasisPoints = 1800;
/** GST TCS under Section 52 (0.5% since July 2024). Base: item total, pending CA (D16). */
export const TCS_BPS: BasisPoints = 50;
/** Income-tax TDS under Section 194-O (0.1% since Oct 2024). Applicability pending CA (D15). */
export const TDS_194O_BPS: BasisPoints = 10;

export type GatewayFeePayer = "CREATOR" | "PLATFORM";

export interface SettlementInput {
  plan: PaymentPlan;
  /** The commission rate copied onto the order when it was placed (0 during the promo). */
  commissionBps: BasisPoints;
  /** Section 194-O may not apply to small sellers who give PAN/Aadhaar (CA to confirm). */
  tdsApplies?: boolean;
  /** Razorpay's actual fee on each payment, once known. */
  gatewayFees?: { mockupPaise?: Paise; advancePaise?: Paise; balancePaise?: Paise };
  /**
   * Who bears gateway fees on the advance and balance (D9, open).
   * The PRD says the creator always bears the fee on the mockup fee.
   */
  advanceAndBalanceFeesPaidBy?: GatewayFeePayer;
}

export interface Settlement {
  /** Item total minus the mockup fee (D8: no commission on mockup fees). */
  commissionBasePaise: Paise;
  commissionPaise: Paise;
  gstOnCommissionPaise: Paise;
  tcsPaise: Paise;
  tdsPaise: Paise;
  /** Kept to pay Shiprocket. */
  shippingRetainedPaise: Paise;
  /** Released to the creator at each non-refundable point. */
  releases: { mockupPaise: Paise; advancePaise: Paise; balancePaise: Paise };
  creatorTotalPaise: Paise;
  /** Gateway fees taken from the creator's releases. */
  gatewayFeesChargedToCreatorPaise: Paise;
  /** Gateway fees the platform absorbs. */
  gatewayFeesAbsorbedByPlatformPaise: Paise;
  /** Commission minus absorbed gateway fees: what the platform actually earns. */
  platformNetRevenuePaise: Paise;
}

export function calculateSettlement(input: SettlementInput): Settlement {
  const { plan, commissionBps } = input;
  if (!Number.isSafeInteger(commissionBps) || commissionBps < 0 || commissionBps > COMMISSION_BPS_MAX) {
    throw new RangeError(`Commission must be 0–${COMMISSION_BPS_MAX} bps.`);
  }

  const commissionBasePaise = plan.itemTotalPaise - plan.mockupPaise;
  const commissionPaise = percentOf(commissionBasePaise, commissionBps);
  const gstOnCommissionPaise = percentOf(commissionPaise, GST_ON_COMMISSION_BPS);
  const tcsPaise = percentOf(plan.itemTotalPaise, TCS_BPS);
  const tdsPaise = input.tdsApplies === false ? 0 : percentOf(plan.itemTotalPaise, TDS_194O_BPS);

  const fees = { mockupPaise: 0, advancePaise: 0, balancePaise: 0, ...input.gatewayFees };
  const creatorPaysLaterFees = (input.advanceAndBalanceFeesPaidBy ?? "CREATOR") === "CREATOR";
  const advanceFee = creatorPaysLaterFees ? fees.advancePaise : 0;
  const balanceFee = creatorPaysLaterFees ? fees.balancePaise : 0;

  const releases = {
    mockupPaise: plan.mockupPaise - fees.mockupPaise,
    advancePaise: plan.advanceDuePaise - advanceFee,
    balancePaise:
      plan.balanceItemPaise - commissionPaise - gstOnCommissionPaise - tcsPaise - tdsPaise - balanceFee,
  };
  if (releases.mockupPaise < 0 || releases.advancePaise < 0 || releases.balancePaise < 0) {
    throw new RangeError("Fees exceed a payment: check the advance % and fee settings.");
  }

  const gatewayFeesChargedToCreatorPaise = fees.mockupPaise + advanceFee + balanceFee;
  const gatewayFeesAbsorbedByPlatformPaise = creatorPaysLaterFees ? 0 : fees.advancePaise + fees.balancePaise;

  return {
    commissionBasePaise,
    commissionPaise,
    gstOnCommissionPaise,
    tcsPaise,
    tdsPaise,
    shippingRetainedPaise: plan.shippingPaise,
    releases,
    creatorTotalPaise: releases.mockupPaise + releases.advancePaise + releases.balancePaise,
    gatewayFeesChargedToCreatorPaise,
    gatewayFeesAbsorbedByPlatformPaise,
    platformNetRevenuePaise: commissionPaise - gatewayFeesAbsorbedByPlatformPaise,
  };
}

/**
 * Must be 0 for every order: everything the buyer paid is accounted for by
 * the creator's releases, the platform's commission, taxes held for the
 * government, shipping, and gateway fees charged to the creator. (Fees the
 * platform absorbs come out of its commission, not out of this total.)
 */
export function reconciliationGap(plan: PaymentPlan, settlement: Settlement): Paise {
  return (
    plan.buyerTotalPaise -
    (settlement.creatorTotalPaise +
      settlement.commissionPaise +
      settlement.gstOnCommissionPaise +
      settlement.tcsPaise +
      settlement.tdsPaise +
      settlement.shippingRetainedPaise +
      settlement.gatewayFeesChargedToCreatorPaise)
  );
}

/** The rate to copy onto a new order: 0 while the creator's promo runs. */
export function commissionForOrder({
  creatorCommissionBps,
  promoEndsOn,
  orderDate,
}: {
  creatorCommissionBps: BasisPoints;
  /** "YYYY-MM-DD" (IST), or null if the creator has no promo. */
  promoEndsOn: string | null;
  /** "YYYY-MM-DD" (IST) the order is placed. */
  orderDate: string;
}): BasisPoints {
  if (promoEndsOn && orderDate < promoEndsOn) return 0;
  return creatorCommissionBps;
}

/** Last day (exclusive) of a new creator's 0% promo. */
export function promoEndsOn(onboardedOn: string): string {
  return addDays(onboardedOn, COMMISSION_PROMO_DAYS);
}

export function isValidCommissionBps(bps: BasisPoints): boolean {
  return Number.isInteger(bps) && bps >= COMMISSION_BPS_MIN && bps <= COMMISSION_BPS_MAX;
}
