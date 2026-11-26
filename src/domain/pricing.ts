// Item price and production time from the buyer's choices.
//
// Shared by the browser and the server:
// - the configurator calls it to show a live total and making time;
// - the placeOrder service calls it again with the product loaded from the
//   database, and that result is what gets saved.
//
// The browser never sends a price. Even if someone edits the page or crafts a
// request by hand, the server recomputes everything from trusted data.
//
// Keep this file free of database/Node imports so it can run in the browser.

import { sum, type Paise } from "./money";
import { chosenOptions, type OptionGroup, type Selections } from "./product-options";

export interface PricedProduct {
  basePricePaise: Paise;
  baseProductionDays: number;
  optionGroups: OptionGroup[];
}

export interface PriceLine {
  label: string;
  amountPaise: Paise;
  extraDays: number;
}

export interface ItemQuote {
  /** Base price first, then every chosen option that changes price or time. */
  lines: PriceLine[];
  itemTotalPaise: Paise;
  productionDays: number;
}

/**
 * Base price + chosen options' modifiers; base production days + chosen
 * options' extra days. Unknown option values add nothing (and are rejected
 * by validateSelections on the server).
 */
export function quoteItem(product: PricedProduct, selections: Selections): ItemQuote {
  const lines: PriceLine[] = [{ label: "Base price", amountPaise: product.basePricePaise, extraDays: 0 }];

  for (const { group, option } of chosenOptions(product.optionGroups, selections)) {
    if (option.pricePaise !== 0 || option.extraDays !== 0) {
      lines.push({ label: `${group.label}: ${option.label}`, amountPaise: option.pricePaise, extraDays: option.extraDays });
    }
  }

  return {
    lines,
    itemTotalPaise: sum(lines.map((line) => line.amountPaise)),
    productionDays: product.baseProductionDays + lines.reduce((days, line) => days + line.extraDays, 0),
  };
}

/** Lowest possible item total: base price plus the cheapest way to satisfy required groups. */
export function startingPrice(product: PricedProduct): Paise {
  let total = product.basePricePaise;
  for (const group of product.optionGroups) {
    if (group.type === "single" && group.required && group.options.length > 0) {
      total += Math.min(...group.options.map((o) => o.pricePaise));
    }
    if (group.type === "multi" && group.min > 0) {
      const cheapest = group.options.map((o) => o.pricePaise).sort((a, b) => a - b);
      total += sum(cheapest.slice(0, group.min));
    }
  }
  return total;
}
