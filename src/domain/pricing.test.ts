import { describe, expect, it } from "vitest";
import { calculatePrice, getPriceLines } from "./pricing";
import type { CustomField } from "./types";

const fields: CustomField[] = [
  { key: "name", label: "Name", type: "text", required: true, options: [] },
  {
    key: "size",
    label: "Size",
    type: "select",
    required: true,
    options: [
      { value: "a4", label: "A4", priceModifier: 0 },
      { value: "a3", label: "A3", priceModifier: 700 },
    ],
  },
  {
    key: "frame",
    label: "Frame",
    type: "select",
    required: false,
    options: [
      { value: "none", label: "No frame", priceModifier: 0 },
      { value: "teak", label: "Teak", priceModifier: 650 },
      { value: "discount", label: "Plain card", priceModifier: -100 },
    ],
  },
];
const product = { basePrice: 1199, customFields: fields };

describe("calculatePrice", () => {
  it("is the base price when nothing adds to it", () => {
    expect(calculatePrice(product, { name: "Anbu", size: "a4" })).toBe(1199);
  });

  it("adds the modifier of every chosen option", () => {
    expect(calculatePrice(product, { size: "a3", frame: "teak" })).toBe(1199 + 700 + 650);
  });

  it("handles negative modifiers", () => {
    expect(calculatePrice(product, { size: "a4", frame: "discount" })).toBe(1099);
  });

  it("ignores option values the product doesn't offer", () => {
    expect(calculatePrice(product, { size: "a0-gold", frame: "free" })).toBe(1199);
  });

  it("ignores text fields, whatever they contain", () => {
    expect(calculatePrice(product, { name: "9999" })).toBe(1199);
  });
});

describe("getPriceLines", () => {
  it("itemises the base price and each non-zero modifier", () => {
    expect(getPriceLines(product, { size: "a3", frame: "none" })).toEqual([
      { label: "Base price", amount: 1199 },
      { label: "Size: A3", amount: 700 },
    ]);
  });
});
