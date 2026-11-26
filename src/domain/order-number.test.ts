import { describe, expect, it } from "vitest";
import { formatOrderNumber, isOrderNumber } from "./order-number";

describe("order numbers", () => {
  it("formats KV-<YYMM>-<sequence>", () => {
    expect(formatOrderNumber("2026-11-26", 42)).toBe("KV-2611-00042");
    expect(formatOrderNumber("2027-01-03", 99999)).toBe("KV-2701-99999");
  });

  it("rejects bad input", () => {
    expect(() => formatOrderNumber("26-11-2026", 1)).toThrow(RangeError);
    expect(() => formatOrderNumber("2026-11-26", 0)).toThrow(RangeError);
  });

  it("recognises order numbers", () => {
    expect(["KV-2611-00042", "KV-2611-42", "kv-2611-00042"].map(isOrderNumber)).toEqual([true, false, false]);
  });
});
