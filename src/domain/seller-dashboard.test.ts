import { describe, expect, it } from "vitest";
import { ymdToDate } from "@/lib/dates";
import type { OrderStatus } from "./order-status";
import { describeDeadline, summarizeSellerOrders } from "./seller-dashboard";
import type { Order } from "./types";

const TODAY = "2026-11-10";
const due = (ymd: string) => ymdToDate(ymd).toISOString();

function order(id: string, status: OrderStatus, deliverBy: string, totalPrice: number): Order {
  return {
    _id: id,
    buyerName: "Buyer",
    buyerPhone: "9840012345",
    creatorId: "a",
    productId: "p",
    productSnapshot: { title: "Gift", basePricePaise: totalPrice, baseProductionDays: 5, imageUrl: "", maxRevisions: 2 },
    selections: {},
    priceLines: [],
    itemTotalPaise: totalPrice,
    productionDays: 5,
    dispatchBy: due(deliverBy),
    estimatedDelivery: due(deliverBy),
    status,
    previews: [],
    createdAt: "",
    updatedAt: "",
  };
}

describe("summarizeSellerOrders", () => {
  const orders = [
    order("1", "IN_PRODUCTION", "2026-11-09", 500), // overdue
    order("2", "PLACED", "2026-11-12", 1000), // not paid yet
    order("3", "PAID", "2026-11-17", 300), // exactly 7 days
    order("4", "DELIVERED", "2026-11-18", 900),
    order("5", "PREVIEW_SENT", "2026-11-30", 200),
  ];
  const summary = summarizeSellerOrders(orders, TODAY);

  it("splits active from completed orders", () => {
    expect(summary.active.map((o) => o._id)).toEqual(["1", "2", "3", "5"]);
    expect(summary.completed.map((o) => o._id)).toEqual(["4"]);
  });

  it("counts active orders due within 7 days, including overdue ones", () => {
    expect(summary.dueThisWeek).toBe(3);
  });

  it("only counts paid orders as money held", () => {
    expect(summary.heldPaise).toBe(500 + 300 + 200);
  });
});

describe("describeDeadline", () => {
  it.each([
    ["2026-11-08", "Overdue by 2 days", "overdue"],
    ["2026-11-09", "Overdue by 1 day", "overdue"],
    ["2026-11-10", "Due today", "overdue"],
    ["2026-11-11", "1 day left", "soon"],
    ["2026-11-13", "3 days left", "soon"],
    ["2026-11-14", "4 days left", "normal"],
  ])("%s -> %s", (deliverBy, label, urgency) => {
    expect(describeDeadline(due(deliverBy), TODAY)).toEqual({ label, urgency });
  });
});
