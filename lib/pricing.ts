// calculatePrice is shared by the browser and the server:
// - the CustomizationForm calls it to show a live price while the buyer types;
// - the createOrder server action calls it again with the product loaded from
//   the database, and that result is what gets saved.
//
// The browser never sends a price. Even if someone edits the page or crafts a
// request by hand, the server recomputes the total from trusted data.
//
// Keep this file free of database/Node imports so it can run in the browser.

import type { CustomField, CustomInputs } from "./types";

export interface PricedProduct {
  basePrice: number;
  customFields: CustomField[];
}

export interface PriceLine {
  label: string;
  amount: number;
}

/** Base price plus the modifier of every chosen select option. Whole rupees. */
export function calculatePrice(product: PricedProduct, inputs: CustomInputs): number {
  return getPriceLines(product, inputs).reduce((sum, line) => sum + line.amount, 0);
}

/** The same calculation, itemised so the buyer can see where the price comes from. */
export function getPriceLines(product: PricedProduct, inputs: CustomInputs): PriceLine[] {
  const lines: PriceLine[] = [{ label: "Base price", amount: product.basePrice }];

  for (const field of product.customFields) {
    if (field.type !== "select") continue;
    // Only options that exist on the product count. An unknown value adds
    // nothing here and is rejected by validateInputs on the server.
    const chosen = field.options.find((option) => option.value === inputs[field.key]);
    if (chosen && chosen.priceModifier !== 0) {
      lines.push({ label: `${field.label}: ${chosen.label}`, amount: chosen.priceModifier });
    }
  }

  return lines;
}
