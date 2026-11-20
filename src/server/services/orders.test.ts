// Order use cases, run against fresh in-memory repositories for each test.
// Same demo data as the app, so the scenarios read like real orders.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addDays } from "@/lib/dates";
import { createMockRepositories } from "@/server/repositories/mock";
import type { Repositories } from "@/server/repositories/types";
import { buildDemoData, type DemoData } from "@/server/demo-data";
import {
  advanceOrder,
  approvePreview,
  payOrder,
  placeOrder,
  requestChanges,
  sendPreview,
  type PlaceOrderInput,
} from "./orders";

// 10:00 IST on Tue 10 Nov 2026.
const NOW = new Date("2026-11-10T04:30:00Z");
const TODAY = "2026-11-10";

let data: DemoData;
let repos: Repositories;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  data = buildDemoData(NOW);
  repos = createMockRepositories({ artists: data.artists, products: data.products, orders: data.orders });
});

afterEach(() => {
  vi.useRealTimers();
});

/** A valid order for Arjun's pencil portrait (base ₹1,199, makes in 7 days). */
function pencilOrder(overrides: Partial<PlaceOrderInput> = {}): PlaceOrderInput {
  return {
    productId: data.productIds.pencil!,
    buyerName: "Test Buyer",
    buyerPhone: "+91 98400 12345",
    deliverBy: addDays(TODAY, 10),
    inputs: { photo: "family.jpg", people: "2", size: "a3", frame: "teak" },
    ...overrides,
  };
}

async function placed(input = pencilOrder()) {
  const result = await placeOrder(input, repos);
  if (!result.ok) throw new Error(result.error);
  return result.value.orderId;
}

const statusOf = async (orderId: string) => (await repos.orders.findById(orderId))!.status;

// ------------------------------------------------------------ placeOrder

describe("placeOrder", () => {
  it("saves the price the server calculates, ignoring anything extra the browser sends", async () => {
    const orderId = await placed(
      pencilOrder({
        inputs: {
          photo: "family.jpg",
          people: "2", // +600
          size: "a3", // +700
          frame: "teak", // +650
          totalPrice: "1", // not a field of this product: must be ignored
        },
      }),
    );

    const order = await repos.orders.findById(orderId);
    expect(order?.totalPrice).toBe(1199 + 600 + 700 + 650);
    expect(order?.inputs).not.toHaveProperty("totalPrice");
    expect(order?.status).toBe("PLACED");
  });

  it("snapshots the product and normalises the phone number", async () => {
    const order = await repos.orders.findById(await placed());
    expect(order?.productSnapshot).toMatchObject({
      title: "Pencil Portrait from Your Photo",
      basePrice: 1199,
      maxRevisions: 2,
    });
    expect(order?.buyerPhone).toBe("9840012345");
  });

  it("rejects options the product doesn't offer", async () => {
    const result = await placeOrder(
      pencilOrder({ inputs: { photo: "a.jpg", people: "1", size: "a4", frame: "gold-plated" } }),
      repos,
    );
    expect(result).toMatchObject({ ok: false, fieldErrors: { frame: "Please choose one of the listed options." } });
  });

  it("reports every problem at once", async () => {
    const result = await placeOrder(
      pencilOrder({ buyerName: "", buyerPhone: "123", inputs: { people: "1", size: "a4", frame: "none" } }),
      repos,
    );
    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.fieldErrors ?? {}).sort()).toEqual(["buyerName", "buyerPhone", "photo"]);
  });

  it("rejects delivery dates the artist can't meet", async () => {
    // Arjun needs 7 days + 2 for shipping.
    const result = await placeOrder(pencilOrder({ deliverBy: addDays(TODAY, 8) }), repos);
    expect(!result.ok && result.fieldErrors?.deliverBy).toBe(
      "The earliest Arjun Selvam can deliver is Thu, 19 Nov.",
    );
    expect((await placeOrder(pencilOrder({ deliverBy: addDays(TODAY, 9) }), repos)).ok).toBe(true);
  });

  it("refuses orders while the artist is paused", async () => {
    const result = await placeOrder(
      {
        productId: data.productIds.coupleSketch!, // Karthik is paused in the demo data
        buyerName: "Test Buyer",
        buyerPhone: "9840012345",
        deliverBy: addDays(TODAY, 20),
        inputs: { photo: "us.jpg", size: "a4" },
      },
      repos,
    );
    expect(result).toEqual({
      ok: false,
      error: "Karthik Murugan has paused new orders for now. Please check back soon.",
    });
  });

  it("refuses unknown products", async () => {
    expect((await placeOrder(pencilOrder({ productId: "not-an-id" }), repos)).ok).toBe(false);
    expect((await placeOrder(pencilOrder({ productId: "0b00000000000000000000ff" }), repos)).ok).toBe(false);
  });
});

// -------------------------------------------------------------- lifecycle

describe("order lifecycle", () => {
  it("goes from placed to delivered, one step at a time", async () => {
    const orderId = await placed();

    expect((await payOrder(orderId, repos)).ok).toBe(true);
    expect((await sendPreview(orderId, repos)).ok).toBe(true);
    expect((await requestChanges(orderId, "Please make the background lighter.", repos)).ok).toBe(true);
    expect(await statusOf(orderId)).toBe("REVISION_REQUESTED");

    expect((await sendPreview(orderId, repos)).ok).toBe(true);
    expect((await approvePreview(orderId, repos)).ok).toBe(true);
    for (const from of ["APPROVED", "IN_PRODUCTION", "SHIPPED"]) {
      expect((await advanceOrder(orderId, from, repos)).ok).toBe(true);
    }

    const order = await repos.orders.findById(orderId);
    expect(order?.status).toBe("DELIVERED");
    expect(order?.previews.map((p) => [p.round, p.response, p.comment])).toEqual([
      [1, "changes_requested", "Please make the background lighter."],
      [2, "approved", ""],
    ]);
  });

  it("can't skip steps", async () => {
    const orderId = await placed();
    expect((await sendPreview(orderId, repos)).ok).toBe(false); // not paid yet
    expect((await approvePreview(orderId, repos)).ok).toBe(false); // no preview yet
    expect((await advanceOrder(orderId, "APPROVED", repos)).ok).toBe(false); // not approved
    expect(await statusOf(orderId)).toBe("PLACED");
  });

  it("applies a repeated action only once (double-clicks, two tabs)", async () => {
    const orderId = await placed();
    expect((await payOrder(orderId, repos)).ok).toBe(true);
    expect((await payOrder(orderId, repos)).ok).toBe(false);

    await sendPreview(orderId, repos);
    expect((await sendPreview(orderId, repos)).ok).toBe(false);
    expect((await repos.orders.findById(orderId))?.previews).toHaveLength(1);

    expect((await approvePreview(orderId, repos)).ok).toBe(true);
    expect((await approvePreview(orderId, repos)).ok).toBe(false);
  });

  it("enforces the revision limit from the order's snapshot", async () => {
    // Prakash's coaster set allows 1 revision and he has already used it.
    const prakash = data.orders.find((o) => o.buyerName === "Prakash Iyer")!;
    await sendPreview(prakash._id, repos);

    const result = await requestChanges(prakash._id, "One more small change, please.", repos);
    expect(result).toEqual({
      ok: false,
      error:
        "You've used all 1 revisions included with this gift. Please approve the preview or contact the artist.",
    });
    expect((await approvePreview(prakash._id, repos)).ok).toBe(true);
  });

  it("asks for a real note when requesting changes", async () => {
    const swetha = data.orders.find((o) => o.buyerName === "Swetha Ramesh")!; // preview waiting
    expect(await requestChanges(swetha._id, "  ok ", repos)).toEqual({
      ok: false,
      error: "Tell the artist what to change — a few words is enough.",
    });
    expect(await statusOf(swetha._id)).toBe("PREVIEW_SENT");
  });

  it("rejects made-up statuses and ids", async () => {
    const orderId = await placed();
    expect((await advanceOrder(orderId, "DELIVERED_TWICE", repos)).ok).toBe(false);
    expect((await payOrder("not-an-id", repos)).ok).toBe(false);
  });
});
