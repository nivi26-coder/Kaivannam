// Numbers and labels for the artist dashboard.

import { daysBetween, toYmdIST } from "@/lib/dates";
import { ACTIVE_STATUSES } from "./order-status";
import type { Order } from "./types";

export interface SellerSummary<T extends Order> {
  /** Orders still needing the artist, soonest deadline first (input order kept). */
  active: T[];
  /** Delivered, paid out or cancelled, most recent first. */
  completed: T[];
  /** Active orders due within 7 days (including overdue ones). */
  dueThisWeek: number;
  /** Rupees buyers have paid that Kaivannam holds until delivery. */
  held: number;
}

/** `orders` should be sorted by deliverBy ascending, as the repositories return them. */
export function summarizeSellerOrders<T extends Order>(orders: T[], today: string): SellerSummary<T> {
  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completed = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status)).reverse();
  return {
    active,
    completed,
    dueThisWeek: active.filter((o) => daysBetween(today, toYmdIST(o.deliverBy)) <= 7).length,
    // PLACED orders aren't paid yet, so nothing is held for them.
    held: active.filter((o) => o.status !== "PLACED").reduce((sum, o) => sum + o.totalPrice, 0),
  };
}

export type DeadlineUrgency = "overdue" | "soon" | "normal";

/** "Overdue by 2 days", "Due today", "3 days left", with how urgent it is. */
export function describeDeadline(
  deliverBy: string,
  today: string,
): { label: string; urgency: DeadlineUrgency } {
  const days = daysBetween(today, toYmdIST(deliverBy));
  if (days < 0) return { label: `Overdue by ${-days} ${days === -1 ? "day" : "days"}`, urgency: "overdue" };
  if (days === 0) return { label: "Due today", urgency: "overdue" };
  if (days <= 3) return { label: `${days} ${days === 1 ? "day" : "days"} left`, urgency: "soon" };
  return { label: `${days} days left`, urgency: "normal" };
}
