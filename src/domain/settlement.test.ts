import { describe, expect, it } from "vitest";
import { rupees } from "./money";
import { calculatePaymentPlan, type CheckoutPath } from "./payment-plan";
import {
  calculateSettlement,
  commissionForOrder,
  isValidCommissionBps,
  promoEndsOn,
  reconciliationGap,
} from "./settlement";

describe("calculateSettlement", () => {
  // The worked example in "Kaivannam — Phase 1 Requirements and Tech Tasks", section 5.
  const plan = calculatePaymentPlan({
    itemTotalPaise: rupees(2000),
    advancePercent: 50,
    path: "MOCKUP_FIRST",
    mockupFeePaise: rupees(149),
    shippingPaise: rupees(90),
  });

  it("matches the Phase 1 plan's worked example to the paisa", () => {
    const s = calculateSettlement({ plan, commissionBps: 500 });
    expect(s.commissionBasePaise).toBe(185100); // ₹2,000 − ₹149 mockup
    expect(s.commissionPaise).toBe(9255); // ₹92.55
    expect(s.gstOnCommissionPaise).toBe(1666); // ₹16.66
    expect(s.tcsPaise).toBe(1000); // ₹10.00
    expect(s.tdsPaise).toBe(200); // ₹2.00
    expect(s.shippingRetainedPaise).toBe(9000);
    expect(s.releases).toEqual({ mockupPaise: 14900, advancePaise: 85100, balancePaise: 87879 });
    expect(s.creatorTotalPaise).toBe(187879); // ₹1,878.79
    expect(reconciliationGap(plan, s)).toBe(0);
  });

  it("charges no commission during the promo, but still collects taxes", () => {
    const s = calculateSettlement({ plan, commissionBps: 0 });
    expect(s.commissionPaise).toBe(0);
    expect(s.gstOnCommissionPaise).toBe(0);
    expect(s.tcsPaise).toBe(1000);
    expect(reconciliationGap(plan, s)).toBe(0);
  });

  it("skips TDS when it doesn't apply", () => {
    expect(calculateSettlement({ plan, commissionBps: 500, tdsApplies: false }).tdsPaise).toBe(0);
  });

  it("charges gateway fees to the creator by default, or absorbs them in the platform's revenue", () => {
    const gatewayFees = { mockupPaise: 300, advancePaise: 1700, balancePaise: 2200 };

    const creatorPays = calculateSettlement({ plan, commissionBps: 500, gatewayFees });
    expect(creatorPays.releases.mockupPaise).toBe(14600);
    expect(creatorPays.gatewayFeesChargedToCreatorPaise).toBe(4200);
    expect(creatorPays.platformNetRevenuePaise).toBe(9255);
    expect(reconciliationGap(plan, creatorPays)).toBe(0);

    const platformPays = calculateSettlement({ plan, commissionBps: 500, gatewayFees, advanceAndBalanceFeesPaidBy: "PLATFORM" });
    expect(platformPays.releases.mockupPaise).toBe(14600); // PRD: mockup fee's gateway fee is always the creator's
    expect(platformPays.releases.advancePaise).toBe(85100);
    expect(platformPays.platformNetRevenuePaise).toBe(9255 - 3900);
    expect(reconciliationGap(plan, platformPays)).toBe(0);
  });

  it("reconciles to the paisa across 2,000 varied orders", () => {
    let seed = 42;
    const random = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;

    for (let i = 0; i < 2000; i++) {
      const path: CheckoutPath = random() < 0.5 ? "MOCKUP_FIRST" : "DIRECT";
      const p = calculatePaymentPlan({
        itemTotalPaise: rupees(149) + Math.floor(random() * 5_000_000),
        advancePercent: 20 + Math.floor(random() * 41),
        path,
        mockupFeePaise: rupees(99) + Math.floor(random() * 10_001),
        shippingPaise: Math.floor(random() * 30_000),
      });
      const s = calculateSettlement({
        plan: p,
        commissionBps: [0, 500, 650, 800][Math.floor(random() * 4)]!,
        tdsApplies: random() < 0.5,
        gatewayFees: { mockupPaise: 0, advancePaise: Math.floor(p.advanceDuePaise * 0.02), balancePaise: Math.floor(p.balanceDuePaise * 0.02) },
        advanceAndBalanceFeesPaidBy: random() < 0.5 ? "CREATOR" : "PLATFORM",
      });
      expect(reconciliationGap(p, s)).toBe(0);
      expect(s.releases.balancePaise).toBeGreaterThanOrEqual(0);
    }
  });

  it("rejects commission above the PRD's maximum", () => {
    expect(() => calculateSettlement({ plan, commissionBps: 1200 })).toThrow(RangeError);
  });
});

describe("commission rate and promo", () => {
  it("is 0% for the creator's first 30 days, then their rate", () => {
    const promo = promoEndsOn("2026-11-01");
    expect(promo).toBe("2026-12-01");
    expect(commissionForOrder({ creatorCommissionBps: 600, promoEndsOn: promo, orderDate: "2026-11-30" })).toBe(0);
    expect(commissionForOrder({ creatorCommissionBps: 600, promoEndsOn: promo, orderDate: "2026-12-01" })).toBe(600);
    expect(commissionForOrder({ creatorCommissionBps: 600, promoEndsOn: null, orderDate: "2026-11-30" })).toBe(600);
  });

  it("allows 5–8%", () => {
    expect([499, 500, 800, 801].map(isValidCommissionBps)).toEqual([false, true, true, false]);
  });
});
