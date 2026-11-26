import { describe, expect, it } from "vitest";
import {
  describeSelections,
  getInitialSelections,
  normalizeSelections,
  validateOptionGroups,
  validateSelections,
  type OptionGroup,
} from "./product-options";

const groups: OptionGroup[] = [
  {
    key: "size",
    label: "Size",
    type: "single",
    required: true,
    options: [
      { value: "a4", label: "A4", pricePaise: 0, extraDays: 0 },
      { value: "a3", label: "A3", pricePaise: 70000, extraDays: 1 },
    ],
  },
  {
    key: "addons",
    label: "Add-ons",
    type: "multi",
    min: 0,
    max: 2,
    options: [
      { value: "candle", label: "Scented candle", pricePaise: 29900, extraDays: 0 },
      { value: "plant", label: "Money plant", pricePaise: 34900, extraDays: 1 },
      { value: "frame", label: "Photo frame", pricePaise: 39900, extraDays: 2 },
    ],
  },
  { key: "names", label: "Names to write", type: "text", required: true, maxLength: 20 },
  { key: "photo", label: "Reference photo", type: "photo", required: false },
];

describe("validateOptionGroups (product builder)", () => {
  it("accepts a well-formed set of groups", () => {
    expect(validateOptionGroups(groups)).toEqual([]);
  });

  it("reports every problem", () => {
    const problems = validateOptionGroups([
      { key: "Size!", label: "", type: "single", required: true, options: [] },
      { key: "dup", label: "Colour", type: "single", required: true, options: [
        { value: "red", label: "Red", pricePaise: 10.5, extraDays: -1 },
        { value: "red", label: "", pricePaise: 0, extraDays: 0 },
      ] },
      { key: "dup", label: "Add-ons", type: "multi", min: 3, max: 2, options: [{ value: "x", label: "X", pricePaise: 0, extraDays: 0 }] },
      { key: "note", label: "Note", type: "text", required: false, maxLength: 0 },
    ]);
    expect(problems).toEqual(expect.arrayContaining([
      expect.stringMatching(/key must start with a letter/),
      expect.stringMatching(/needs a label/),
      expect.stringMatching(/needs at least one option/),
      expect.stringMatching(/two options use the value "red"/),
      expect.stringMatching(/price must be whole paise/),
      expect.stringMatching(/extra days must be 0–60/),
      expect.stringMatching(/two groups use the key "dup"/),
      expect.stringMatching(/minimum ≤ maximum/),
      expect.stringMatching(/text limit/),
    ]));
  });
});

describe("normalizeSelections", () => {
  it("keeps only known groups, trims text, and shapes single vs multi values", () => {
    expect(
      normalizeSelections(groups, {
        size: ["a3", "a4"],
        addons: ["candle", "candle", " plant "],
        names: "  Anbu & Kavi ",
        totalPrice: "1",
      }),
    ).toEqual({ size: "a3", addons: ["candle", "plant"], names: "Anbu & Kavi", photo: "" });
  });
});

describe("validateSelections", () => {
  it("accepts valid answers", () => {
    expect(validateSelections(groups, { size: "a3", addons: ["plant"], names: "Anbu", photo: "" })).toEqual({});
  });

  it("explains missing and invalid answers", () => {
    expect(validateSelections(groups, { size: "", addons: ["candle", "plant", "frame"], names: "x".repeat(21), photo: "" })).toEqual({
      size: "Please choose size.",
      addons: "Please choose at most 2.",
      names: "Please keep this under 20 characters.",
    });
    expect(validateSelections(groups, { size: "a0", addons: ["gold"], names: "", photo: "" })).toEqual({
      size: "Please choose one of the listed options.",
      addons: "Please choose from the listed options.",
      names: "Please fill in names to write.",
    });
  });

  it("enforces a multi-choice minimum and required photos", () => {
    const strict: OptionGroup[] = [
      { ...(groups[1] as Extract<OptionGroup, { type: "multi" }>), min: 1 },
      { key: "photo", label: "Reference photo", type: "photo", required: true },
    ];
    expect(validateSelections(strict, { addons: [], photo: "" })).toEqual({
      addons: "Please choose at least one add-ons option.",
      photo: "Please add a photo.",
    });
  });
});

describe("getInitialSelections and describeSelections", () => {
  it("preselects required single choices", () => {
    expect(getInitialSelections(groups)).toEqual({ size: "a4", addons: [], names: "", photo: "" });
  });

  it("shows labels, joins add-ons and skips empty answers", () => {
    expect(describeSelections(groups, { size: "a3", addons: ["candle", "frame"], names: "Anbu", photo: "" })).toEqual([
      { label: "Size", value: "A3" },
      { label: "Add-ons", value: "Scented candle, Photo frame" },
      { label: "Names to write", value: "Anbu" },
    ]);
  });

  it("falls back to raw keys when the product was deleted", () => {
    expect(describeSelections(null, { size: "a3", addons: ["candle"], photo: "" })).toEqual([
      { label: "size", value: "a3" },
      { label: "addons", value: "candle" },
    ]);
  });
});
