// When will the gift arrive?
//
// Ready to ship (dispatch) = today (India) + production days.
// Delivered = dispatch + courier transit days.
// In Phase 1 the transit days come from Shiprocket's pincode check (T5.3);
// until then DEFAULT_TRANSIT_DAYS stands in.
//
// The server computes dates at request time and passes `today` to the
// browser, so the buyer's clock and time zone never matter.

import { addDays, todayIST } from "@/lib/dates";

/** Courier days assumed until the Shiprocket pincode check provides real ones. */
export const DEFAULT_TRANSIT_DAYS = 3;

export interface DeliveryEstimate {
  /** "YYYY-MM-DD": the creator should hand the parcel to the courier by this day. */
  dispatchBy: string;
  /** "YYYY-MM-DD": expected arrival. */
  deliverBy: string;
}

export function estimateDelivery({
  productionDays,
  transitDays = DEFAULT_TRANSIT_DAYS,
  today = todayIST(),
}: {
  productionDays: number;
  transitDays?: number;
  today?: string;
}): DeliveryEstimate {
  if (!Number.isInteger(productionDays) || productionDays < 0) {
    throw new RangeError(`Invalid production days: ${productionDays}`);
  }
  if (!Number.isInteger(transitDays) || transitDays < 0) {
    throw new RangeError(`Invalid transit days: ${transitDays}`);
  }
  const dispatchBy = addDays(today, productionDays);
  return { dispatchBy, deliverBy: addDays(dispatchBy, transitDays) };
}
