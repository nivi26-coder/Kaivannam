import { afterEach, describe, expect, it, vi } from "vitest";
import { todayIST } from "@/lib/dates";
import { deliveryWindow, MAX_DAYS_AHEAD, SHIPPING_DAYS, validateDeliverBy } from "./delivery";

afterEach(() => {
  vi.useRealTimers();
});

describe("deliveryWindow", () => {
  it("is making time + shipping days from today, up to 6 months ahead", () => {
    expect(SHIPPING_DAYS).toBe(2);
    expect(MAX_DAYS_AHEAD).toBe(180);
    expect(deliveryWindow(5, "2026-11-10")).toEqual({ earliest: "2026-11-17", latest: "2027-05-09" });
  });

  it("uses India's date, not the server's UTC date", () => {
    // 19:00 UTC on 10 Nov is 00:30 IST on 11 Nov: a UTC server would still say the 10th.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-10T19:00:00Z"));
    expect(todayIST()).toBe("2026-11-11");
    expect(deliveryWindow(5).earliest).toBe("2026-11-18");
  });
});

describe("validateDeliverBy", () => {
  const window = deliveryWindow(5, "2026-11-10");

  it("accepts dates inside the window, including both ends", () => {
    expect(validateDeliverBy("2026-11-17", window, "Kavya")).toBeUndefined();
    expect(validateDeliverBy("2027-05-09", window, "Kavya")).toBeUndefined();
  });

  it("explains when the artist can't make it in time", () => {
    expect(validateDeliverBy("2026-11-16", window, "Kavya")).toBe(
      "The earliest Kavya can deliver is Tue, 17 Nov.",
    );
  });

  it("rejects dates too far ahead and invalid dates", () => {
    expect(validateDeliverBy("2027-05-10", window, "Kavya")).toMatch(/6 months/);
    expect(validateDeliverBy("2026-02-30", window, "Kavya")).toBe("Choose a delivery date.");
    expect(validateDeliverBy("", window, "Kavya")).toBe("Choose a delivery date.");
  });
});
