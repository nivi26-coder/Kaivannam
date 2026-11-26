import { describe, expect, it } from "vitest";
import { rupees } from "./money";
import {
  balanceReminders,
  canCancel,
  deadlineFor,
  planTransition,
  refundOnCancel,
  STARTING_STATUS,
  type Actor,
  type LifecycleEvent,
  type LifecycleOrder,
  type LifecycleStatus,
} from "./order-lifecycle";
import { calculatePaymentPlan } from "./payment-plan";

function order(status: LifecycleStatus, extra: Partial<LifecycleOrder> = {}): LifecycleOrder {
  return { status, revisionsUsed: 0, maxRevisions: 2, finishedChangesUsed: 0, mockupUploaded: false, ...extra };
}

/** Applies events in order, asserting each is allowed. */
function walk(start: LifecycleOrder, steps: [LifecycleEvent, Actor][]) {
  const o = { ...start };
  const releases: string[] = [];
  for (const [event, actor] of steps) {
    const result = planTransition(o, event, actor, "2026-11-26T10:00:00.000Z");
    if (!result.ok) throw new Error(`${event} by ${actor}: ${result.reason}`);
    if (result.release) releases.push(result.release);
    if (event === "SEND_MOCKUP") o.mockupUploaded = true;
    if (event === "REQUEST_REVISION") o.revisionsUsed++;
    if (event === "REQUEST_CHANGES") o.finishedChangesUsed++;
    if (event === "DELIVER") o.deliveredAt = "2026-11-26T09:00:00.000Z";
    o.status = result.to;
  }
  return { status: o.status, releases };
}

describe("both checkout paths", () => {
  it("Path A: mockup first, one revision, then the full lifecycle", () => {
    const result = walk(order(STARTING_STATUS.MOCKUP_FIRST), [
      ["PAY_MOCKUP", "SYSTEM"],
      ["SEND_MOCKUP", "CREATOR"],
      ["REQUEST_REVISION", "BUYER"],
      ["SEND_MOCKUP", "CREATOR"],
      ["APPROVE_MOCKUP", "BUYER"],
      ["PAY_ADVANCE", "SYSTEM"],
      ["START_PRODUCTION", "CREATOR"],
      ["MARK_READY", "CREATOR"],
      ["PAY_BALANCE", "SYSTEM"],
      ["PICK_UP", "SYSTEM"],
      ["DELIVER", "SYSTEM"],
    ]);
    expect(result.status).toBe("DELIVERED");
    // The mockup fee is released once (first upload), the advance at production start.
    expect(result.releases).toEqual(["MOCKUP", "ADVANCE"]);
  });

  it("Path B: direct order with one round of changes to the finished gift", () => {
    const result = walk(order(STARTING_STATUS.DIRECT), [
      ["PAY_ADVANCE", "SYSTEM"],
      ["START_PRODUCTION", "CREATOR"],
      ["MARK_READY", "CREATOR"],
      ["REQUEST_CHANGES", "BUYER"],
      ["MARK_READY", "CREATOR"],
      ["PAY_BALANCE", "SYSTEM"],
      ["PICK_UP", "ADMIN"],
      ["DELIVER", "SYSTEM"],
    ]);
    expect(result.status).toBe("DELIVERED");
    expect(result.releases).toEqual(["ADVANCE"]);
  });
});

describe("guards", () => {
  it("only the right actor can act", () => {
    expect(planTransition(order("ADVANCE_PENDING"), "PAY_ADVANCE", "BUYER").ok).toBe(false); // only a verified payment
    expect(planTransition(order("ADVANCE_PAID"), "START_PRODUCTION", "BUYER").ok).toBe(false);
    expect(planTransition(order("MOCKUP_SENT"), "APPROVE_MOCKUP", "CREATOR").ok).toBe(false);
  });

  it("steps can't be skipped", () => {
    expect(planTransition(order("ADVANCE_PENDING"), "START_PRODUCTION", "CREATOR")).toEqual({
      ok: false,
      reason: "Can't start production while the order is ADVANCE_PENDING.",
    });
    expect(planTransition(order("IN_PRODUCTION"), "PAY_BALANCE", "SYSTEM").ok).toBe(false);
  });

  it("enforces the revision limit from the order snapshot", () => {
    expect(planTransition(order("MOCKUP_SENT", { revisionsUsed: 2, maxRevisions: 2 }), "REQUEST_REVISION", "BUYER")).toEqual({
      ok: false,
      reason: "All 2 revisions included with this gift are used.",
    });
  });

  it("allows one round of finished-gift changes", () => {
    expect(planTransition(order("READY_TO_SHIP", { finishedChangesUsed: 1 }), "REQUEST_CHANGES", "BUYER").ok).toBe(false);
  });

  it("accepts disputes only within the window after delivery", () => {
    const delivered = order("DELIVERED", { deliveredAt: "2026-11-24T10:00:00.000Z" });
    expect(planTransition(delivered, "DISPUTE", "BUYER", "2026-11-26T09:59:00.000Z").ok).toBe(true);
    expect(planTransition(delivered, "DISPUTE", "BUYER", "2026-11-26T10:01:00.000Z").ok).toBe(false);
    expect(planTransition(order("DELIVERED"), "DISPUTE", "BUYER").ok).toBe(false); // no delivery time
  });

  it("disputes are resolved by an admin", () => {
    expect(planTransition(order("DISPUTED"), "RESOLVE_DISPUTE", "BUYER").ok).toBe(false);
    expect(planTransition(order("DISPUTED"), "RESOLVE_DISPUTE", "ADMIN")).toEqual({ ok: true, to: "DELIVERED" });
  });
});

describe("cancelling", () => {
  it("buyers and creators can cancel before production; afterwards only admins", () => {
    expect(canCancel("ADVANCE_PAID", "BUYER")).toBe(true);
    expect(canCancel("ADVANCE_PAID", "CREATOR")).toBe(true);
    expect(canCancel("IN_PRODUCTION", "BUYER")).toBe(false);
    expect(canCancel("IN_PRODUCTION", "ADMIN")).toBe(true);
    expect(canCancel("SHIPPED", "ADMIN")).toBe(false);
    expect(planTransition(order("MOCKUP_PENDING"), "CANCEL", "SYSTEM").ok).toBe(false); // the job uses EXPIRE
  });

  const pathA = calculatePaymentPlan({ itemTotalPaise: rupees(2000), advancePercent: 50, path: "MOCKUP_FIRST", mockupFeePaise: rupees(149), shippingPaise: rupees(90) });
  const pathB = calculatePaymentPlan({ itemTotalPaise: rupees(2000), advancePercent: 50, path: "DIRECT", shippingPaise: rupees(90) });

  it("refunds held money and keeps released money (PRD §6)", () => {
    expect(refundOnCancel(order("MOCKUP_PENDING"), pathA).refundPaise).toBe(0);
    expect(refundOnCancel(order("MOCKUP_PAID"), pathA).refundPaise).toBe(14900); // no mockup yet
    expect(refundOnCancel(order("MOCKUP_PAID", { mockupUploaded: true }), pathA).refundPaise).toBe(0); // after a revision request
    expect(refundOnCancel(order("MOCKUP_SENT", { mockupUploaded: true }), pathA).refundPaise).toBe(0);
    expect(refundOnCancel(order("ADVANCE_PAID", { mockupUploaded: true }), pathA)).toEqual({ refundPaise: 85100, kept: ["mockup fee"] });
    expect(refundOnCancel(order("ADVANCE_PAID"), pathB)).toEqual({ refundPaise: 100000, kept: [] });
    expect(refundOnCancel(order("IN_PRODUCTION"), pathB).refundPaise).toBe(0);
    expect(refundOnCancel(order("BALANCE_PAID"), pathB).refundPaise).toBe(109000);
  });
});

describe("deadlines", () => {
  const entered = "2026-11-26T10:00:00.000Z";

  it("expires unpaid orders after 48 hours", () => {
    expect(deadlineFor(order("ADVANCE_PENDING"), entered)).toEqual({ at: "2026-11-28T10:00:00.000Z", action: "EXPIRE" });
    expect(deadlineFor(order("MOCKUP_APPROVED"), entered)?.action).toBe("EXPIRE");
  });

  it("gives creators 3 days for the first mockup, then escalates late revisions", () => {
    expect(deadlineFor(order("MOCKUP_PAID"), entered)).toEqual({ at: "2026-11-29T10:00:00.000Z", action: "EXPIRE" });
    expect(deadlineFor(order("MOCKUP_PAID", { mockupUploaded: true }), entered)?.action).toBe("ESCALATE");
  });

  it("releases the balance when the dispute window closes", () => {
    expect(deadlineFor(order("DELIVERED"), entered)).toEqual({ at: "2026-11-28T10:00:00.000Z", action: "RELEASE_BALANCE" });
  });

  it("reminds buyers about the balance on days 2 and 5, escalating on day 7", () => {
    expect(balanceReminders(entered)).toEqual(["2026-11-28T10:00:00.000Z", "2026-12-01T10:00:00.000Z"]);
    expect(deadlineFor(order("READY_TO_SHIP"), entered)).toEqual({ at: "2026-12-03T10:00:00.000Z", action: "ESCALATE" });
  });

  it("has no deadline once shipped", () => {
    expect(deadlineFor(order("SHIPPED"), entered)).toBeNull();
  });

  it("expiring is only for the scheduled job", () => {
    expect(planTransition(order("ADVANCE_PENDING"), "EXPIRE", "SYSTEM")).toEqual({ ok: true, to: "CANCELLED" });
    expect(planTransition(order("ADVANCE_PENDING"), "EXPIRE", "BUYER").ok).toBe(false);
    expect(planTransition(order("IN_PRODUCTION"), "EXPIRE", "SYSTEM").ok).toBe(false);
  });
});
