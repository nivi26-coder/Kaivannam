// Delivery-date rules: when can a gift arrive?
//
// The earliest date is today (in India) + the artist's making time + courier
// days. The server computes the window at request time and hands it to the
// form, so the browser's clock and time zone never matter.

import { addDays, formatDate, isValidYmd, todayIST } from "@/lib/dates";

/** Days we allow for courier delivery after the artist finishes making. */
export const SHIPPING_DAYS = 2;

/** How far ahead buyers can book. */
export const MAX_DAYS_AHEAD = 180;

export interface DeliveryWindow {
  /** "YYYY-MM-DD" */
  earliest: string;
  /** "YYYY-MM-DD" */
  latest: string;
}

export function deliveryWindow(makingTimeDays: number, today: string = todayIST()): DeliveryWindow {
  return {
    earliest: addDays(today, makingTimeDays + SHIPPING_DAYS),
    latest: addDays(today, MAX_DAYS_AHEAD),
  };
}

/** An error message for the buyer, or undefined if the date is fine. */
export function validateDeliverBy(
  deliverBy: string,
  window: DeliveryWindow,
  artistName: string,
): string | undefined {
  if (!isValidYmd(deliverBy)) return "Choose a delivery date.";
  if (deliverBy < window.earliest) {
    return `The earliest ${artistName} can deliver is ${formatDate(window.earliest)}.`;
  }
  if (deliverBy > window.latest) return "Please choose a date within the next 6 months.";
  return undefined;
}
