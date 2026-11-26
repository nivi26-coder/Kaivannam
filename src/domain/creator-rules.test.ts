import { describe, expect, it } from "vitest";
import { canShipTo, normalizeHandle, validateCreatorGstin, validateHandle } from "./creator-rules";
import { gstinCheckCharacter, isValidPincode, stateCodeFor, validateGstin } from "./india";

describe("handles", () => {
  it("normalises what creators type", () => {
    expect(normalizeHandle("  @Kavya.Resin ")).toBe("kavya.resin");
  });

  it.each([
    ["kavya.resin", undefined],
    ["arjun_sketches", undefined],
    ["ab", "Use 3–30 characters."],
    ["kavya resin", "Use lowercase letters, numbers, dots, dashes and underscores."],
    [".kavya", "Start and end with a letter or number."],
    ["kavya..resin", "Don't put two symbols in a row."],
    ["checkout", "That name is reserved. Please choose another."],
  ])("%s → %s", (handle, error) => {
    expect(validateHandle(handle)).toBe(error);
  });
});

describe("GSTIN", () => {
  it("accepts the GST portal's published sample GSTIN", () => {
    expect(gstinCheckCharacter("27AAPFU0939F1Z")).toBe("V");
    expect(validateGstin(" 27aapfu0939f1zv ")).toEqual({ ok: true, gstin: "27AAPFU0939F1ZV", stateCode: "27" });
  });

  it("catches typos, bad shapes and unknown states", () => {
    expect(validateGstin("27AAPFU0939F1ZW")).toMatchObject({ ok: false, reason: expect.stringMatching(/typo/) });
    expect(validateGstin("27AAPFU0939F1Z")).toMatchObject({ ok: false, reason: expect.stringMatching(/15 characters/) });
    expect(validateGstin("99AAPFU0939F1ZV")).toMatchObject({ ok: false, reason: expect.stringMatching(/state code/) });
  });

  it("must be registered in the state the creator ships from", () => {
    expect(validateCreatorGstin("27AAPFU0939F1ZV", "27")).toBeUndefined();
    expect(validateCreatorGstin("27AAPFU0939F1ZV", "33")).toBe(
      "This GSTIN is registered in Maharashtra, but you ship from Tamil Nadu.",
    );
  });
});

describe("states and pincodes", () => {
  it("maps state names to GST codes", () => {
    expect(stateCodeFor("Tamil Nadu")).toBe("33");
    expect(stateCodeFor("TAMIL-NADU")).toBe("33");
    expect(stateCodeFor("Andaman & Nicobar Islands")).toBe("35");
    expect(stateCodeFor("Atlantis")).toBeUndefined();
  });

  it("validates pincodes", () => {
    expect(["600001", " 641002 ", "060001", "60001", "6000011"].map(isValidPincode)).toEqual([true, true, false, false, false]);
  });
});

describe("canShipTo (D4)", () => {
  it("lets creators without a GSTIN ship only within their state", () => {
    expect(canShipTo({ creatorHasGstin: false, pickupStateCode: "33", deliveryStateCode: "33" })).toEqual({ allowed: true });
    expect(canShipTo({ creatorHasGstin: false, pickupStateCode: "33", deliveryStateCode: "29" })).toEqual({
      allowed: false,
      reason: "This creator can only deliver within Tamil Nadu for now.",
    });
  });

  it("lets GST-registered creators ship anywhere in India", () => {
    expect(canShipTo({ creatorHasGstin: true, pickupStateCode: "33", deliveryStateCode: "07" })).toEqual({ allowed: true });
  });
});
