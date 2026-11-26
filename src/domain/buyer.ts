// The buyer's contact details and shipping address. Used by both the checkout
// form (instant feedback) and the placeOrder service (the check that counts),
// so the two can never disagree.

import { isValidIndianMobile, normalizePhone } from "@/lib/phone";
import type { FieldErrors } from "./errors";
import { isStateCode, isValidPincode } from "./india";

export interface BuyerDetails {
  buyerName: string;
  buyerPhone: string;
}

/** Cleans the details (trimmed name, 10-digit phone) and reports problems. */
export function validateBuyerDetails(raw: BuyerDetails): {
  value: BuyerDetails;
  errors: FieldErrors;
} {
  const value = { buyerName: raw.buyerName.trim(), buyerPhone: normalizePhone(raw.buyerPhone) };
  const errors: FieldErrors = {};

  if (value.buyerName.length < 2) errors.buyerName = "Please enter your name.";
  else if (value.buyerName.length > 80) errors.buyerName = "Please use a shorter name.";

  if (!isValidIndianMobile(value.buyerPhone)) errors.buyerPhone = "Enter a 10-digit mobile number.";

  return { value, errors };
}

/** Where the gift goes. The recipient is often not the buyer. */
export interface ShippingAddress {
  recipientName: string;
  recipientPhone: string;
  line1: string;
  line2: string;
  city: string;
  /** GST state code, e.g. "33" for Tamil Nadu. */
  stateCode: string;
  pincode: string;
}

/** Cleans an address for the courier label and reports problems (PAY-1, D13). */
export function validateShippingAddress(raw: ShippingAddress): { value: ShippingAddress; errors: FieldErrors } {
  const tidy = (s: string) => s.trim().replace(/\s+/g, " ");
  const value: ShippingAddress = {
    recipientName: tidy(raw.recipientName),
    recipientPhone: normalizePhone(raw.recipientPhone),
    line1: tidy(raw.line1),
    line2: tidy(raw.line2),
    city: tidy(raw.city),
    stateCode: raw.stateCode.trim(),
    pincode: raw.pincode.trim(),
  };
  const errors: FieldErrors = {};

  if (value.recipientName.length < 2) errors.recipientName = "Enter the recipient's name.";
  if (!isValidIndianMobile(value.recipientPhone)) errors.recipientPhone = "Enter the recipient's 10-digit mobile number.";
  if (value.line1.length < 5) errors.line1 = "Enter the house number and street.";
  if (value.line1.length > 120 || value.line2.length > 120) errors.line1 = "Keep each address line under 120 characters.";
  if (value.city.length < 2) errors.city = "Enter the city or town.";
  if (!isStateCode(value.stateCode)) errors.stateCode = "Choose a state.";
  if (!isValidPincode(value.pincode)) errors.pincode = "Enter a 6-digit pincode.";

  return { value, errors };
}
