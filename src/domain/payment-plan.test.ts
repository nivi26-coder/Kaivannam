import { describe, expect, it } from "vitest";
import { rupees } from "./money";
import { calculatePaymentPlan, isValidAdvancePercent, isValidMockupFee } from "./payment-plan";

describe("calculatePaymentPlan", () => {
  it("Path A: mockup fee is credited against the advance (Phase 1 plan worked example)", () => {
    expect(
      calculatePaymentPlan({
        itemTotalPaise: rupees(2000),
        advancePercent: 50,
        path: "MOCKUP_FIRST",
        mockupFeePaise: rupees(149),
        shippingPaise: rupees(90),
      }),
    ).toEqual({
      path: "MOCKUP_FIRST",
      itemTotalPaise: 200000,
      mockupPaise: 14900,
      advanceGrossPaise: 100000,
      advanceDuePaise: 85100,
      balanceItemPaise: 100000,
      shippingPaise: 9000,
      balanceDuePaise: 109000,
      buyerTotalPaise: 209000,
    });
  });

  it("Path B: no mockup, advance then balance", () => {
    const plan = calculatePaymentPlan({ itemTotalPaise: rupees(1199), advancePercent: 50, path: "DIRECT", mockupFeePaise: rupees(149) });
    expect(plan.mockupPaise).toBe(0);
    expect(plan.advanceDuePaise).toBe(59950); // ₹599.50
    expect(plan.balanceDuePaise).toBe(59950);
    expect(plan.buyerTotalPaise).toBe(119900);
  });

  it("carries leftover mockup credit to the balance when the fee exceeds the advance", () => {
    const plan = calculatePaymentPlan({ itemTotalPaise: rupees(400), advancePercent: 20, path: "MOCKUP_FIRST", mockupFeePaise: rupees(149) });
    expect(plan.advanceGrossPaise).toBe(8000);
    expect(plan.advanceDuePaise).toBe(0);
    expect(plan.balanceItemPaise).toBe(40000 - 8000 - 6900);
    expect(plan.buyerTotalPaise).toBe(40000);
  });

  it("always charges the buyer exactly item total + shipping", () => {
    for (const advancePercent of [20, 33, 50, 60]) {
      for (const item of [rupees(149), rupees(999.99), rupees(1199), rupees(25000)]) {
        const plan = calculatePaymentPlan({ itemTotalPaise: item, advancePercent, path: "MOCKUP_FIRST", mockupFeePaise: rupees(149), shippingPaise: 7300 });
        expect(plan.buyerTotalPaise).toBe(item + 7300);
      }
    }
  });

  it("rejects invalid settings", () => {
    const base = { itemTotalPaise: rupees(1000), advancePercent: 50, path: "DIRECT" as const };
    expect(() => calculatePaymentPlan({ ...base, advancePercent: 70 })).toThrow(/20–60%/);
    expect(() => calculatePaymentPlan({ ...base, path: "MOCKUP_FIRST", mockupFeePaise: null })).toThrow(/no paid mockup/);
    expect(() => calculatePaymentPlan({ ...base, path: "MOCKUP_FIRST", mockupFeePaise: rupees(50) })).toThrow(/₹99–₹199/);
    expect(() => calculatePaymentPlan({ ...base, itemTotalPaise: 0 })).toThrow(RangeError);
    expect(() => calculatePaymentPlan({ ...base, shippingPaise: 10.5 })).toThrow(RangeError);
  });
});

describe("settings ranges", () => {
  it("advance is a whole 20–60%", () => {
    expect([19, 20, 60, 61, 50.5].map(isValidAdvancePercent)).toEqual([false, true, true, false, false]);
  });

  it("mockup fee is ₹99–₹199", () => {
    expect([rupees(98.99), rupees(99), rupees(199), rupees(199.01)].map(isValidMockupFee)).toEqual([false, true, true, false]);
  });
});
