// The buyer's contact details. One function used by both the checkout form
// (instant feedback) and the placeOrder service (the check that counts), so
// the two can never disagree.

import { isValidIndianMobile, normalizePhone } from "@/lib/phone";
import type { FieldErrors } from "./custom-fields";

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
