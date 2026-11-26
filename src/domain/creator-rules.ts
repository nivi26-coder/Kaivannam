// Creator rules: storefront handles and where a creator may ship (ONB-1, ONB-4, D4).

import { GST_STATES, validateGstin } from "./india";

/**
 * Handles live at the site root (kaivannam.in/<handle>), so they can't
 * collide with the app's own routes or look official.
 */
export const RESERVED_HANDLES = new Set([
  "about", "account", "admin", "api", "app", "artists", "auth", "blog", "checkout", "contact",
  "creator", "creators", "dashboard", "faq", "grievance", "help", "home", "kaivannam", "legal",
  "login", "logout", "orders", "pay", "payments", "privacy", "products", "refunds", "settings",
  "shipping", "shop", "signup", "static", "support", "terms", "www",
]);

/** "@Kavya.Resin " → "kavya.resin" */
export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

/** An error message, or undefined if the handle is usable (uniqueness is checked by the database). */
export function validateHandle(handle: string): string | undefined {
  if (handle.length < 3 || handle.length > 30) return "Use 3–30 characters.";
  if (!/^[a-z0-9._-]+$/.test(handle)) return "Use lowercase letters, numbers, dots, dashes and underscores.";
  if (!/^[a-z0-9]/.test(handle) || !/[a-z0-9]$/.test(handle)) return "Start and end with a letter or number.";
  if (/[._-]{2}/.test(handle)) return "Don't put two symbols in a row.";
  if (RESERVED_HANDLES.has(handle)) return "That name is reserved. Please choose another.";
  return undefined;
}

/**
 * D4 (pending CA): creators without a GSTIN may only sell within their own
 * state through an e-commerce operator, so out-of-state delivery is blocked.
 */
export function canShipTo({
  creatorHasGstin,
  pickupStateCode,
  deliveryStateCode,
}: {
  creatorHasGstin: boolean;
  pickupStateCode: string;
  deliveryStateCode: string;
}): { allowed: true } | { allowed: false; reason: string } {
  if (creatorHasGstin || pickupStateCode === deliveryStateCode) return { allowed: true };
  const state = GST_STATES[pickupStateCode] ?? "their state";
  return { allowed: false, reason: `This creator can only deliver within ${state} for now.` };
}

/**
 * GST registration is per state: a creator shipping from one state needs a
 * GSTIN from that state.
 */
export function validateCreatorGstin(raw: string, pickupStateCode: string): string | undefined {
  const result = validateGstin(raw);
  if (!result.ok) return result.reason;
  if (result.stateCode !== pickupStateCode) {
    return `This GSTIN is registered in ${GST_STATES[result.stateCode]}, but you ship from ${GST_STATES[pickupStateCode] ?? "another state"}.`;
  }
  return undefined;
}
