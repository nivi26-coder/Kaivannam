import { describe, expect, it } from "vitest";
import { rupees } from "./money";
import { quoteItem, startingPrice, type PricedProduct } from "./pricing";

const product: PricedProduct = {
  basePricePaise: rupees(1199),
  baseProductionDays: 7,
  optionGroups: [
    { key: "name", label: "Name", type: "text", required: true, maxLength: 40 },
    {
      key: "size",
      label: "Size",
      type: "single",
      required: true,
      options: [
        { value: "a4", label: "A4", pricePaise: 0, extraDays: 0 },
        { value: "a3", label: "A3", pricePaise: rupees(700), extraDays: 1 },
      ],
    },
    {
      key: "addons",
      label: "Add-ons",
      type: "multi",
      min: 0,
      max: 3,
      options: [
        { value: "frame", label: "Teak frame", pricePaise: rupees(650), extraDays: 2 },
        { value: "gift-wrap", label: "Gift wrap", pricePaise: rupees(49.5), extraDays: 0 },
        { value: "plain", label: "Plain card", pricePaise: rupees(-100), extraDays: 0 },
      ],
    },
  ],
};

describe("quoteItem", () => {
  it("is the base price and base days when nothing adds to them", () => {
    expect(quoteItem(product, { name: "Anbu", size: "a4", addons: [] })).toEqual({
      lines: [{ label: "Base price", amountPaise: 119900, extraDays: 0 }],
      itemTotalPaise: 119900,
      productionDays: 7,
    });
  });

  it("adds every chosen option's price and extra days", () => {
    const quote = quoteItem(product, { size: "a3", addons: ["frame", "gift-wrap"] });
    expect(quote.itemTotalPaise).toBe(119900 + 70000 + 65000 + 4950); // ₹2,598.50
    expect(quote.productionDays).toBe(7 + 1 + 2);
    expect(quote.lines.map((l) => l.label)).toEqual(["Base price", "Size: A3", "Add-ons: Teak frame", "Add-ons: Gift wrap"]);
  });

  it("handles negative modifiers", () => {
    expect(quoteItem(product, { size: "a4", addons: ["plain"] }).itemTotalPaise).toBe(109900);
  });

  it("ignores option values the product doesn't offer, and text answers", () => {
    expect(quoteItem(product, { name: "99999", size: "a0-gold", addons: ["free-diamond"] }).itemTotalPaise).toBe(119900);
  });
});

describe("startingPrice", () => {
  it("is the cheapest way to satisfy required groups", () => {
    expect(startingPrice(product)).toBe(119900);
    expect(
      startingPrice({
        ...product,
        optionGroups: [{ key: "x", label: "X", type: "multi", min: 2, max: 3, options: [
          { value: "a", label: "A", pricePaise: 500, extraDays: 0 },
          { value: "b", label: "B", pricePaise: 100, extraDays: 0 },
          { value: "c", label: "C", pricePaise: 300, extraDays: 0 },
        ] }],
      }),
    ).toBe(119900 + 100 + 300);
  });
});
