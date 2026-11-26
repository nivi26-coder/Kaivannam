// What a product needs before it can be published (PROD-1, PROD-3, PROD-4, D11, D12).

import type { FieldErrors } from "./errors";
import { rupees, type Paise } from "./money";
import { isValidAdvancePercent, isValidMockupFee, ADVANCE_PERCENT_MAX, ADVANCE_PERCENT_MIN } from "./payment-plan";
import { startingPrice } from "./pricing";
import { validateOptionGroups, type OptionGroup } from "./product-options";

export const PRODUCT_LIMITS = {
  titleMax: 80,
  descriptionMax: 2000,
  photosMax: 6,
  priceMinPaise: rupees(1),
  priceMaxPaise: rupees(500000),
  productionDaysMax: 90,
  revisionsMax: 5,
  weightGramsMax: 30000,
  packageCmMax: 150,
} as const;

export interface ProductDraft {
  title: string;
  slug: string;
  description: string;
  images: string[];
  basePricePaise: Paise;
  baseProductionDays: number;
  maxRevisions: number;
  /** Packed weight, for Shiprocket rates and labels. */
  weightGrams: number;
  packageCm: { length: number; width: number; height: number };
  optionGroups: OptionGroup[];
  /** Null when the product has no paid mockup. */
  mockupFeePaise: Paise | null;
  advancePercent: number;
}

const isWhole = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;

/** "Name Keychain with Real Flowers!" → "name-keychain-with-real-flowers" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // drop accents: "é" → "e"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

export function validateProductForPublish(draft: ProductDraft): FieldErrors {
  const errors: FieldErrors = {};
  const L = PRODUCT_LIMITS;

  if (!draft.title.trim()) errors.title = "Give the product a title.";
  else if (draft.title.length > L.titleMax) errors.title = `Keep the title under ${L.titleMax} characters.`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug)) errors.slug = "Use lowercase letters, numbers and single dashes.";
  if (draft.description.length > L.descriptionMax) errors.description = `Keep the description under ${L.descriptionMax} characters.`;

  if (draft.images.length === 0) errors.images = "Add at least one photo.";
  else if (draft.images.length > L.photosMax) errors.images = `Use at most ${L.photosMax} photos.`;

  if (!isWhole(draft.basePricePaise, L.priceMinPaise, L.priceMaxPaise)) {
    errors.basePricePaise = "Set a price between ₹1 and ₹5,00,000.";
  }
  if (!isWhole(draft.baseProductionDays, 1, L.productionDaysMax)) {
    errors.baseProductionDays = `Production time must be 1–${L.productionDaysMax} days.`;
  }
  if (!isWhole(draft.maxRevisions, 0, L.revisionsMax)) errors.maxRevisions = `Allow 0–${L.revisionsMax} revisions.`;

  if (!isWhole(draft.weightGrams, 1, L.weightGramsMax)) errors.weightGrams = "Enter the packed weight in grams (up to 30 kg).";
  const { length, width, height } = draft.packageCm;
  if (![length, width, height].every((d) => isWhole(d, 1, L.packageCmMax))) {
    errors.packageCm = `Enter the package size in whole centimetres (up to ${L.packageCmMax} cm).`;
  }

  const optionProblems = validateOptionGroups(draft.optionGroups);
  if (optionProblems.length > 0) errors.optionGroups = optionProblems.join(" ");

  if (draft.mockupFeePaise !== null) {
    if (!isValidMockupFee(draft.mockupFeePaise)) errors.mockupFeePaise = "Set the mockup fee between ₹99 and ₹199.";
    else if (!errors.basePricePaise && draft.mockupFeePaise > startingPrice(draft)) {
      errors.mockupFeePaise = "The mockup fee can't be more than the product's lowest price.";
    }
  }
  if (!isValidAdvancePercent(draft.advancePercent)) {
    errors.advancePercent = `Set the advance between ${ADVANCE_PERCENT_MIN}% and ${ADVANCE_PERCENT_MAX}%.`;
  }

  return errors;
}
