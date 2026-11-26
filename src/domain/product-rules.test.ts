import { describe, expect, it } from "vitest";
import { rupees } from "./money";
import { slugify, validateProductForPublish, type ProductDraft } from "./product-rules";

const valid: ProductDraft = {
  title: "Name Keychain with Real Flowers",
  slug: "name-keychain-with-real-flowers",
  description: "Clear resin with gold-foil letters.",
  images: ["https://images.unsplash.com/photo-1"],
  basePricePaise: rupees(349),
  baseProductionDays: 5,
  maxRevisions: 2,
  weightGrams: 80,
  packageCm: { length: 12, width: 8, height: 4 },
  optionGroups: [{ key: "name", label: "Name on keychain", type: "text", required: true, maxLength: 20 }],
  mockupFeePaise: rupees(99),
  advancePercent: 50,
};

describe("validateProductForPublish", () => {
  it("accepts a complete product", () => {
    expect(validateProductForPublish(valid)).toEqual({});
  });

  it("lists every missing or out-of-range field", () => {
    const errors = validateProductForPublish({
      ...valid,
      title: "",
      slug: "Bad Slug",
      images: [],
      basePricePaise: 0,
      baseProductionDays: 0,
      maxRevisions: 9,
      weightGrams: 0,
      packageCm: { length: 0, width: 8, height: 4 },
      optionGroups: [{ key: "x", label: "", type: "single", required: true, options: [] }],
      mockupFeePaise: rupees(250),
      advancePercent: 80,
    });
    expect(Object.keys(errors).sort()).toEqual([
      "advancePercent", "basePricePaise", "baseProductionDays", "images", "maxRevisions",
      "mockupFeePaise", "optionGroups", "packageCm", "slug", "title", "weightGrams",
    ]);
  });

  it("allows no mockup at all", () => {
    expect(validateProductForPublish({ ...valid, mockupFeePaise: null })).toEqual({});
  });

  it("keeps the mockup fee below the product's lowest price", () => {
    expect(validateProductForPublish({ ...valid, basePricePaise: rupees(120), mockupFeePaise: rupees(149) }).mockupFeePaise).toBe(
      "The mockup fee can't be more than the product's lowest price.",
    );
  });
});

describe("slugify", () => {
  it("turns titles into URL-safe slugs", () => {
    expect(slugify("Name Keychain with Real Flowers!")).toBe("name-keychain-with-real-flowers");
    expect(slugify("  Résin  Coasters — Set of 4 ")).toBe("resin-coasters-set-of-4");
  });
});
