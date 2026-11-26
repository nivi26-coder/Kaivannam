// Phase 1 order lifecycle (PRD §3.2–3.3, §6; decisions D6, D10, D18, D19).
//
// Path A, mockup first: MOCKUP_PENDING → MOCKUP_PAID → MOCKUP_SENT → MOCKUP_APPROVED → ADVANCE_PAID
// Path B, direct:       ADVANCE_PENDING → ADVANCE_PAID
// Both:                 ADVANCE_PAID → IN_PRODUCTION → READY_TO_SHIP → BALANCE_PAID → SHIPPED → DELIVERED
//
// Every rule about who can move an order, what money is released, what is
// refunded and which deadlines apply lives here, so services, scheduled jobs
// and the UI all agree.
//
// The demo still runs on the simpler flow in order-status.ts. E6 (T6.3)
// switches the app to this lifecycle and deletes the demo flow.

import type { Paise } from "./money";
import type { CheckoutPath, PaymentPlan } from "./payment-plan";

export const LIFECYCLE_STATUSES = [
  "MOCKUP_PENDING",
  "MOCKUP_PAID",
  "MOCKUP_SENT",
  "MOCKUP_APPROVED",
  "ADVANCE_PENDING",
  "ADVANCE_PAID",
  "IN_PRODUCTION",
  "READY_TO_SHIP",
  "BALANCE_PAID",
  "SHIPPED",
  "DELIVERED",
  "DISPUTED",
  "CANCELLED",
] as const;

export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

export type Actor = "BUYER" | "CREATOR" | "ADMIN" | "SYSTEM";

export type LifecycleEvent =
  | "PAY_MOCKUP"
  | "SEND_MOCKUP"
  | "REQUEST_REVISION"
  | "APPROVE_MOCKUP"
  | "PAY_ADVANCE"
  | "START_PRODUCTION"
  | "MARK_READY"
  | "REQUEST_CHANGES"
  | "PAY_BALANCE"
  | "PICK_UP"
  | "DELIVER"
  | "DISPUTE"
  | "RESOLVE_DISPUTE"
  | "CANCEL"
  | "EXPIRE";

/** The payment released to the creator by a transition (D6). */
export type Release = "MOCKUP" | "ADVANCE";

/** Finished-photo change rounds before paying the balance (Q9 default). */
export const FINISHED_CHANGE_ROUNDS = 1;

export const DEADLINES = {
  /** Unpaid orders (and approved mockups awaiting the advance) expire (D19). */
  unpaidHours: 48,
  /** The creator uploads the first mockup within this many days or the fee is refunded (D19). */
  mockupUploadDays: 3,
  /** The buyer pays the balance within this many days of Ready to ship (D19). */
  balancePaymentDays: 7,
  balanceReminderDays: [2, 5],
  /** After delivery the buyer can dispute for this long; then the balance is released (D18, Q10 default). */
  disputeWindowHours: 48,
} as const;

export const STARTING_STATUS: Record<CheckoutPath, LifecycleStatus> = {
  MOCKUP_FIRST: "MOCKUP_PENDING",
  DIRECT: "ADVANCE_PENDING",
};

/** What a transition needs to know about the order. */
export interface LifecycleOrder {
  status: LifecycleStatus;
  /** Mockup revision requests used, and the limit copied onto the order. */
  revisionsUsed: number;
  maxRevisions: number;
  finishedChangesUsed: number;
  /** True once any mockup has been uploaded (the fee is then non-refundable). */
  mockupUploaded: boolean;
  /** ISO time the order was delivered, if it has been. */
  deliveredAt?: string | null;
}

type Rule = { from: LifecycleStatus[]; to: LifecycleStatus; actors: Actor[] };

const PRE_PRODUCTION: LifecycleStatus[] = [
  "MOCKUP_PENDING",
  "MOCKUP_PAID",
  "MOCKUP_SENT",
  "MOCKUP_APPROVED",
  "ADVANCE_PENDING",
  "ADVANCE_PAID",
];

const RULES: Record<Exclude<LifecycleEvent, "CANCEL" | "EXPIRE">, Rule> = {
  PAY_MOCKUP: { from: ["MOCKUP_PENDING"], to: "MOCKUP_PAID", actors: ["SYSTEM"] },
  SEND_MOCKUP: { from: ["MOCKUP_PAID"], to: "MOCKUP_SENT", actors: ["CREATOR"] },
  REQUEST_REVISION: { from: ["MOCKUP_SENT"], to: "MOCKUP_PAID", actors: ["BUYER"] },
  APPROVE_MOCKUP: { from: ["MOCKUP_SENT"], to: "MOCKUP_APPROVED", actors: ["BUYER"] },
  PAY_ADVANCE: { from: ["MOCKUP_APPROVED", "ADVANCE_PENDING"], to: "ADVANCE_PAID", actors: ["SYSTEM"] },
  START_PRODUCTION: { from: ["ADVANCE_PAID"], to: "IN_PRODUCTION", actors: ["CREATOR"] },
  MARK_READY: { from: ["IN_PRODUCTION"], to: "READY_TO_SHIP", actors: ["CREATOR"] },
  REQUEST_CHANGES: { from: ["READY_TO_SHIP"], to: "IN_PRODUCTION", actors: ["BUYER"] },
  PAY_BALANCE: { from: ["READY_TO_SHIP"], to: "BALANCE_PAID", actors: ["SYSTEM"] },
  PICK_UP: { from: ["BALANCE_PAID"], to: "SHIPPED", actors: ["SYSTEM", "ADMIN"] },
  DELIVER: { from: ["SHIPPED"], to: "DELIVERED", actors: ["SYSTEM", "ADMIN"] },
  DISPUTE: { from: ["DELIVERED"], to: "DISPUTED", actors: ["BUYER"] },
  RESOLVE_DISPUTE: { from: ["DISPUTED"], to: "DELIVERED", actors: ["ADMIN"] },
};

export type TransitionResult =
  | { ok: true; to: LifecycleStatus; release?: Release }
  | { ok: false; reason: string };

/**
 * Can `actor` apply `event` to this order now? If so, the new status and any
 * payment to release. `now` is an ISO time (only the dispute window uses it).
 */
export function planTransition(
  order: LifecycleOrder,
  event: LifecycleEvent,
  actor: Actor,
  now: string = new Date().toISOString(),
): TransitionResult {
  if (event === "CANCEL") {
    return canCancel(order.status, actor)
      ? { ok: true, to: "CANCELLED" }
      : { ok: false, reason: `${actor.toLowerCase()} can't cancel an order that is ${order.status}.` };
  }
  if (event === "EXPIRE") {
    return actor === "SYSTEM" && EXPIRABLE.includes(order.status)
      ? { ok: true, to: "CANCELLED" }
      : { ok: false, reason: `An order that is ${order.status} doesn't expire.` };
  }

  const rule = RULES[event];
  if (!rule.from.includes(order.status)) {
    return { ok: false, reason: `Can't ${describe(event)} while the order is ${order.status}.` };
  }
  if (!rule.actors.includes(actor)) {
    return { ok: false, reason: `Only ${rule.actors.join(" or ").toLowerCase()} can ${describe(event)}.` };
  }

  if (event === "REQUEST_REVISION" && order.revisionsUsed >= order.maxRevisions) {
    return { ok: false, reason: `All ${order.maxRevisions} revisions included with this gift are used.` };
  }
  if (event === "REQUEST_CHANGES" && order.finishedChangesUsed >= FINISHED_CHANGE_ROUNDS) {
    return { ok: false, reason: "Changes to the finished gift were already requested." };
  }
  if (event === "DISPUTE" && !isWithinDisputeWindow(order.deliveredAt ?? null, now)) {
    return { ok: false, reason: `Disputes can be raised within ${DEADLINES.disputeWindowHours} hours of delivery.` };
  }

  // D6: release each payment at the moment it becomes non-refundable.
  if (event === "SEND_MOCKUP" && !order.mockupUploaded) return { ok: true, to: rule.to, release: "MOCKUP" };
  if (event === "START_PRODUCTION") return { ok: true, to: rule.to, release: "ADVANCE" };
  return { ok: true, to: rule.to };
}

function describe(event: LifecycleEvent): string {
  return event.toLowerCase().replaceAll("_", " ");
}

// ---------------------------------------------------- cancel and refund

/** Statuses the scheduled job may cancel when their deadline passes. */
const EXPIRABLE: LifecycleStatus[] = ["MOCKUP_PENDING", "ADVANCE_PENDING", "MOCKUP_APPROVED", "MOCKUP_PAID"];

/** Buyers and creators can cancel before production; after that only an admin. */
export function canCancel(status: LifecycleStatus, actor: Actor): boolean {
  if (PRE_PRODUCTION.includes(status)) return actor !== "SYSTEM";
  if (status === "IN_PRODUCTION" || status === "READY_TO_SHIP" || status === "BALANCE_PAID") {
    return actor === "ADMIN";
  }
  return false; // shipped, delivered, disputed or already cancelled
}

/**
 * What goes back to the buyer when an order is cancelled (PRD §6):
 * held money is refunded; released money (mockup fee after the first
 * upload, advance after production started) is not.
 */
export function refundOnCancel(order: LifecycleOrder, plan: PaymentPlan): { refundPaise: Paise; kept: string[] } {
  switch (order.status) {
    case "MOCKUP_PAID":
      return order.mockupUploaded
        ? { refundPaise: 0, kept: ["mockup fee (a mockup was already delivered)"] }
        : { refundPaise: plan.mockupPaise, kept: [] };
    case "MOCKUP_SENT":
    case "MOCKUP_APPROVED":
      return { refundPaise: 0, kept: ["mockup fee (a mockup was already delivered)"] };
    case "ADVANCE_PAID":
      return { refundPaise: plan.advanceDuePaise, kept: plan.mockupPaise > 0 ? ["mockup fee"] : [] };
    case "IN_PRODUCTION":
    case "READY_TO_SHIP":
      return { refundPaise: 0, kept: ["advance (production had started)", ...(plan.mockupPaise > 0 ? ["mockup fee"] : [])] };
    case "BALANCE_PAID":
      return { refundPaise: plan.balanceDuePaise, kept: ["advance (production had started)", ...(plan.mockupPaise > 0 ? ["mockup fee"] : [])] };
    default:
      return { refundPaise: 0, kept: [] };
  }
}

// ------------------------------------------------------------ deadlines

export type DeadlineAction = "EXPIRE" | "ESCALATE" | "RELEASE_BALANCE";

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const later = (iso: string, ms: number) => new Date(Date.parse(iso) + ms).toISOString();

/**
 * The deadline that applies in a status, counted from when the order
 * entered it, and what the scheduled job does when it passes.
 */
export function deadlineFor(
  order: Pick<LifecycleOrder, "status" | "mockupUploaded">,
  enteredStatusAt: string,
): { at: string; action: DeadlineAction } | null {
  switch (order.status) {
    case "MOCKUP_PENDING":
    case "ADVANCE_PENDING":
    case "MOCKUP_APPROVED":
      return { at: later(enteredStatusAt, DEADLINES.unpaidHours * HOUR_MS), action: "EXPIRE" };
    case "MOCKUP_PAID":
      // No mockup yet: cancel and refund. A late revision: ask an admin to nudge the creator.
      return {
        at: later(enteredStatusAt, DEADLINES.mockupUploadDays * DAY_MS),
        action: order.mockupUploaded ? "ESCALATE" : "EXPIRE",
      };
    case "READY_TO_SHIP":
      return { at: later(enteredStatusAt, DEADLINES.balancePaymentDays * DAY_MS), action: "ESCALATE" };
    case "DELIVERED":
      return { at: later(enteredStatusAt, DEADLINES.disputeWindowHours * HOUR_MS), action: "RELEASE_BALANCE" };
    default:
      return null;
  }
}

/** Reminder times for an unpaid balance after Ready to ship. */
export function balanceReminders(readyAt: string): string[] {
  return DEADLINES.balanceReminderDays.map((days) => later(readyAt, days * DAY_MS));
}

export function isWithinDisputeWindow(deliveredAt: string | null, now: string): boolean {
  if (!deliveredAt) return false;
  const elapsed = Date.parse(now) - Date.parse(deliveredAt);
  return elapsed >= 0 && elapsed <= DEADLINES.disputeWindowHours * HOUR_MS;
}

// ------------------------------------------------------- display labels

export const BUYER_LABEL: Record<LifecycleStatus, string> = {
  MOCKUP_PENDING: "Pay for your mockup",
  MOCKUP_PAID: "Mockup in progress",
  MOCKUP_SENT: "Mockup ready to review",
  MOCKUP_APPROVED: "Pay the advance",
  ADVANCE_PENDING: "Pay the advance",
  ADVANCE_PAID: "Advance paid — held safely",
  IN_PRODUCTION: "Being made",
  READY_TO_SHIP: "Approve and pay the balance",
  BALANCE_PAID: "Packing for dispatch",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  DISPUTED: "Problem reported",
  CANCELLED: "Cancelled",
};

export const CREATOR_LABEL: Record<LifecycleStatus, string> = {
  MOCKUP_PENDING: "Waiting for mockup payment",
  MOCKUP_PAID: "Upload a mockup",
  MOCKUP_SENT: "Waiting for buyer's review",
  MOCKUP_APPROVED: "Waiting for advance",
  ADVANCE_PENDING: "Waiting for advance",
  ADVANCE_PAID: "Start making",
  IN_PRODUCTION: "Being made",
  READY_TO_SHIP: "Waiting for balance",
  BALANCE_PAID: "Generate shipping label",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  DISPUTED: "Buyer reported a problem",
  CANCELLED: "Cancelled",
};

export function isLifecycleStatus(value: unknown): value is LifecycleStatus {
  return typeof value === "string" && (LIFECYCLE_STATUSES as readonly string[]).includes(value);
}
