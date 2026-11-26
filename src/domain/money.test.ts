import { describe, expect, it } from "vitest";
import { percent, percentOf, rupees, sum } from "./money";

describe("rupees", () => {
  it("converts typed rupees to paise", () => {
    expect(rupees(1199)).toBe(119900);
    expect(rupees(599.5)).toBe(59950);
    expect(rupees(0.1 + 0.2)).toBe(30); // float noise is rounded away
  });

  it("rejects non-numbers", () => {
    expect(() => rupees(Number.NaN)).toThrow(RangeError);
  });
});

describe("percentOf", () => {
  it("rounds half-up to the paisa", () => {
    expect(percentOf(119900, percent(50))).toBe(59950);
    expect(percentOf(185100, percent(5))).toBe(9255);
    expect(percentOf(9255, percent(18))).toBe(1666); // 1665.9
    expect(percentOf(1199, percent(0.5))).toBe(6); // 5.995
    expect(percentOf(100, percent(0.5))).toBe(1); // exactly half → up
  });

  it("is symmetric for negative amounts", () => {
    expect(percentOf(-1199, percent(0.5))).toBe(-6);
  });

  it("rejects fractional paise and negative rates", () => {
    expect(() => percentOf(10.5, 100)).toThrow(RangeError);
    expect(() => percentOf(100, -1)).toThrow(RangeError);
  });
});

describe("sum", () => {
  it("adds whole paise and rejects fractions", () => {
    expect(sum([14900, 85100, 109000])).toBe(209000);
    expect(() => sum([1, 0.5])).toThrow(RangeError);
  });
});
