import { describe, expect, it } from "vitest";
import { validateBuyerDetails, validateShippingAddress, type ShippingAddress } from "./buyer";

describe("validateShippingAddress", () => {
  const address: ShippingAddress = {
    recipientName: " Kala  Akka ",
    recipientPhone: "+91 98400 12345",
    line1: " 12,  Kamarajar Street ",
    line2: "",
    city: "Coimbatore",
    stateCode: "33",
    pincode: " 641002 ",
  };

  it("tidies a valid address for the courier label", () => {
    expect(validateShippingAddress(address)).toEqual({
      value: { ...address, recipientName: "Kala Akka", recipientPhone: "9840012345", line1: "12, Kamarajar Street", pincode: "641002" },
      errors: {},
    });
  });

  it("reports each problem", () => {
    const { errors } = validateShippingAddress({ ...address, recipientName: "", recipientPhone: "123", line1: "12", city: "", stateCode: "99", pincode: "64100" });
    expect(Object.keys(errors).sort()).toEqual(["city", "line1", "pincode", "recipientName", "recipientPhone", "stateCode"]);
  });
});

describe("validateBuyerDetails", () => {
  it.each([
    ["98400 12345", "9840012345"],
    ["+91 98400-12345", "9840012345"],
    ["09840012345", "9840012345"],
    ["919840012345", "9840012345"],
  ])("normalises %s to a 10-digit mobile number", (raw, expected) => {
    const { value, errors } = validateBuyerDetails({ buyerName: "Swetha", buyerPhone: raw });
    expect(value.buyerPhone).toBe(expected);
    expect(errors).toEqual({});
  });

  it.each(["12345", "5840012345", "98400123456"])("rejects %s", (raw) => {
    const { errors } = validateBuyerDetails({ buyerName: "Swetha", buyerPhone: raw });
    expect(errors.buyerPhone).toBe("Enter a 10-digit mobile number.");
  });

  it("trims the name and requires at least 2 characters", () => {
    expect(validateBuyerDetails({ buyerName: "  Swetha  ", buyerPhone: "9840012345" }).value.buyerName).toBe(
      "Swetha",
    );
    expect(validateBuyerDetails({ buyerName: " S ", buyerPhone: "9840012345" }).errors.buyerName).toBe(
      "Please enter your name.",
    );
  });
});
