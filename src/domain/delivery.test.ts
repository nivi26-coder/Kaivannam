import { afterEach, describe, expect, it, vi } from "vitest";
import { todayIST } from "@/lib/dates";
import { DEFAULT_TRANSIT_DAYS, estimateDelivery } from "./delivery";

afterEach(() => {
  vi.useRealTimers();
});

describe("estimateDelivery", () => {
  it("is production days to dispatch, then courier transit days", () => {
    expect(estimateDelivery({ productionDays: 7, transitDays: 4, today: "2026-11-26" })).toEqual({
      dispatchBy: "2026-12-03",
      deliverBy: "2026-12-07",
    });
  });

  it("assumes default transit days until Shiprocket provides real ones", () => {
    expect(DEFAULT_TRANSIT_DAYS).toBe(3);
    expect(estimateDelivery({ productionDays: 5, today: "2026-11-26" }).deliverBy).toBe("2026-12-04");
  });

  it("uses India's date, not the server's UTC date", () => {
    // 19:00 UTC on 25 Nov is 00:30 IST on 26 Nov: a UTC server would still say the 25th.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-25T19:00:00Z"));
    expect(todayIST()).toBe("2026-11-26");
    expect(estimateDelivery({ productionDays: 7, transitDays: 0 }).dispatchBy).toBe("2026-12-03");
  });

  it("rejects impossible durations", () => {
    expect(() => estimateDelivery({ productionDays: -1 })).toThrow(RangeError);
    expect(() => estimateDelivery({ productionDays: 2, transitDays: 1.5 })).toThrow(RangeError);
  });
});
