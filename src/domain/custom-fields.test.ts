import { describe, expect, it } from "vitest";
import { describeInputs, getInitialInputs, MAX_TEXT_LENGTH, validateInputs } from "./custom-fields";
import type { CustomField } from "./types";

const fields: CustomField[] = [
  { key: "name", label: "Name on keychain", type: "text", required: true, options: [] },
  { key: "photo", label: "Reference photo", type: "image", required: true, options: [] },
  {
    key: "flower",
    label: "Flowers inside",
    type: "select",
    required: true,
    options: [
      { value: "rose", label: "Pink rose buds", priceModifier: 0 },
      { value: "daisy", label: "Yellow daisies", priceModifier: 0 },
    ],
  },
  { key: "initials", label: "Initials", type: "text", required: false, options: [] },
];

describe("validateInputs", () => {
  it("accepts complete, valid input", () => {
    expect(validateInputs(fields, { name: "Anbu", photo: "a.jpg", flower: "rose" })).toEqual({});
  });

  it("explains each missing required field", () => {
    expect(validateInputs(fields, { name: "  ", photo: "", flower: "" })).toEqual({
      name: "Please fill in name on keychain.",
      photo: "Please add a photo.",
      flower: "Please choose flowers inside.",
    });
  });

  it("rejects select values that aren't listed options", () => {
    const errors = validateInputs(fields, { name: "A", photo: "a.jpg", flower: "orchid" });
    expect(errors.flower).toBe("Please choose one of the listed options.");
  });

  it("limits text length", () => {
    const errors = validateInputs(fields, {
      name: "x".repeat(MAX_TEXT_LENGTH + 1),
      photo: "a.jpg",
      flower: "rose",
    });
    expect(errors.name).toMatch(/under 200 characters/);
  });

  it("lets optional fields stay empty", () => {
    expect(validateInputs(fields, { name: "A", photo: "a.jpg", flower: "rose", initials: "" })).toEqual({});
  });
});

describe("getInitialInputs", () => {
  it("preselects the first option of required selects and leaves the rest empty", () => {
    expect(getInitialInputs(fields)).toEqual({ name: "", photo: "", flower: "rose", initials: "" });
  });
});

describe("describeInputs", () => {
  it("shows option labels instead of stored values, skipping empty fields", () => {
    expect(describeInputs(fields, { name: "Anbu", flower: "daisy", initials: "" })).toEqual([
      { label: "Name on keychain", value: "Anbu" },
      { label: "Flowers inside", value: "Yellow daisies" },
    ]);
  });

  it("falls back to raw keys when the product was deleted", () => {
    expect(describeInputs(null, { flower: "daisy" })).toEqual([{ label: "flower", value: "daisy" }]);
  });
});
