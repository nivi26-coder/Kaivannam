// Product option groups: what a buyer can customise, and what each choice
// adds to the price and to the production time (PRD §3.1).
//
// Used by the creator's product builder (validateOptionGroups), the buyer's
// configurator for instant feedback, and the placeOrder service for the
// checks that count (normalizeSelections + validateSelections).

import type { FieldErrors } from "./errors";
import type { Paise } from "./money";

export type OptionGroupType = "single" | "multi" | "text" | "photo";

export interface OptionChoice {
  value: string;
  label: string;
  /** Added to the base price when chosen. Can be 0 or negative. */
  pricePaise: Paise;
  /** Added to the production time when chosen. */
  extraDays: number;
}

interface GroupBase {
  /** Stable identifier, e.g. "size" or "addOns": letters, digits, - and _, starting with a letter. */
  key: string;
  label: string;
}

/** Pick exactly one (e.g. Size). */
export interface SingleChoiceGroup extends GroupBase {
  type: "single";
  required: boolean;
  options: OptionChoice[];
}

/** Pick between `min` and `max` (e.g. Add-ons). */
export interface MultiChoiceGroup extends GroupBase {
  type: "multi";
  min: number;
  max: number;
  options: OptionChoice[];
}

/** Free text (e.g. names to write). */
export interface TextGroup extends GroupBase {
  type: "text";
  required: boolean;
  maxLength: number;
}

/** A reference photo from the buyer. */
export interface PhotoGroup extends GroupBase {
  type: "photo";
  required: boolean;
}

export type OptionGroup = SingleChoiceGroup | MultiChoiceGroup | TextGroup | PhotoGroup;

/** The buyer's answers, keyed by group key: a string, or a list for multi-choice. */
export type Selections = Record<string, string | string[]>;

export const LIMITS = {
  groupsPerProduct: 12,
  optionsPerGroup: 20,
  textMaxLength: 500,
  maxExtraDays: 60,
  photoRefMaxLength: 300,
} as const;

const KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/;

export function isGroupRequired(group: OptionGroup): boolean {
  return group.type === "multi" ? group.min > 0 : group.required;
}

export function isChoiceGroup(group: OptionGroup): group is SingleChoiceGroup | MultiChoiceGroup {
  return group.type === "single" || group.type === "multi";
}

// ---------------------------------------------------------- the builder

/**
 * Checks a creator's option groups before a product can be published.
 * Returns one message per problem (empty when everything is fine).
 */
export function validateOptionGroups(groups: OptionGroup[]): string[] {
  const problems: string[] = [];
  if (groups.length > LIMITS.groupsPerProduct) {
    problems.push(`Use at most ${LIMITS.groupsPerProduct} option groups.`);
  }

  const keys = new Set<string>();
  for (const group of groups) {
    const name = group.label.trim() || group.key;
    if (!KEY_PATTERN.test(group.key)) problems.push(`"${name}": the key must start with a letter and use only letters, digits, - or _.`);
    if (keys.has(group.key)) problems.push(`"${name}": two groups use the key "${group.key}".`);
    keys.add(group.key);
    if (!group.label.trim()) problems.push(`Group "${group.key}" needs a label.`);

    if (group.type === "text" && (group.maxLength < 1 || group.maxLength > LIMITS.textMaxLength)) {
      problems.push(`"${name}": the text limit must be between 1 and ${LIMITS.textMaxLength} characters.`);
    }

    if (!isChoiceGroup(group)) continue;

    if (group.options.length === 0) problems.push(`"${name}" needs at least one option.`);
    if (group.options.length > LIMITS.optionsPerGroup) {
      problems.push(`"${name}": use at most ${LIMITS.optionsPerGroup} options.`);
    }
    const values = new Set<string>();
    for (const option of group.options) {
      const optionName = option.label.trim() || option.value;
      if (!option.value.trim()) problems.push(`"${name}": every option needs a value.`);
      if (values.has(option.value)) problems.push(`"${name}": two options use the value "${option.value}".`);
      values.add(option.value);
      if (!option.label.trim()) problems.push(`"${name}": every option needs a label.`);
      if (!Number.isSafeInteger(option.pricePaise)) problems.push(`"${name} → ${optionName}": price must be whole paise.`);
      if (!Number.isInteger(option.extraDays) || option.extraDays < 0 || option.extraDays > LIMITS.maxExtraDays) {
        problems.push(`"${name} → ${optionName}": extra days must be 0–${LIMITS.maxExtraDays}.`);
      }
    }

    if (group.type === "multi") {
      if (!Number.isInteger(group.min) || !Number.isInteger(group.max) || group.min < 0 || group.max < 1) {
        problems.push(`"${name}": minimum and maximum picks must be whole numbers (maximum at least 1).`);
      } else if (group.min > group.max || group.max > group.options.length) {
        problems.push(`"${name}": picks must satisfy minimum ≤ maximum ≤ number of options.`);
      }
    }
  }
  return problems;
}

// ------------------------------------------------------ buyer selections

/**
 * Keeps only the groups the product defines, in the shape each expects:
 * trimmed text, single values as strings, multi values as unique lists.
 * Anything else in `raw` (an injected "totalPrice", say) is dropped.
 */
export function normalizeSelections(
  groups: OptionGroup[],
  raw: Record<string, string | string[] | undefined>,
): Selections {
  const selections: Selections = {};
  for (const group of groups) {
    const value = raw[group.key];
    const list = (Array.isArray(value) ? value : value === undefined ? [] : [value])
      .map((v) => v.trim())
      .filter(Boolean);
    selections[group.key] = group.type === "multi" ? [...new Set(list)] : (list[0] ?? "");
  }
  return selections;
}

/** Checks the buyer's answers against the product's groups. */
export function validateSelections(groups: OptionGroup[], selections: Selections): FieldErrors {
  const errors: FieldErrors = {};

  for (const group of groups) {
    const value = selections[group.key];
    const label = group.label.toLowerCase();

    if (group.type === "multi") {
      const picked = Array.isArray(value) ? value : [];
      if (picked.some((v) => !group.options.some((o) => o.value === v))) {
        errors[group.key] = "Please choose from the listed options.";
      } else if (picked.length < group.min) {
        errors[group.key] =
          group.min === 1 ? `Please choose at least one ${label} option.` : `Please choose at least ${group.min}.`;
      } else if (picked.length > group.max) {
        errors[group.key] = `Please choose at most ${group.max}.`;
      }
      continue;
    }

    const text = typeof value === "string" ? value.trim() : "";
    if (!text) {
      if (group.required) {
        errors[group.key] =
          group.type === "single"
            ? `Please choose ${label}.`
            : group.type === "photo"
              ? "Please add a photo."
              : `Please fill in ${label}.`;
      }
      continue;
    }

    if (group.type === "single" && !group.options.some((o) => o.value === text)) {
      errors[group.key] = "Please choose one of the listed options.";
    }
    if (group.type === "text" && text.length > group.maxLength) {
      errors[group.key] = `Please keep this under ${group.maxLength} characters.`;
    }
    if (group.type === "photo" && text.length > LIMITS.photoRefMaxLength) {
      errors[group.key] = "That photo reference is too long.";
    }
  }

  return errors;
}

/** Starting answers: first option for required single-choice groups, empty otherwise. */
export function getInitialSelections(groups: OptionGroup[]): Selections {
  return Object.fromEntries(
    groups.map((group) => [
      group.key,
      group.type === "multi" ? [] : group.type === "single" && group.required ? (group.options[0]?.value ?? "") : "",
    ]),
  );
}

/** The options a buyer picked, across all choice groups, with their group. */
export function chosenOptions(
  groups: OptionGroup[],
  selections: Selections,
): { group: SingleChoiceGroup | MultiChoiceGroup; option: OptionChoice }[] {
  const chosen: { group: SingleChoiceGroup | MultiChoiceGroup; option: OptionChoice }[] = [];
  for (const group of groups) {
    if (!isChoiceGroup(group)) continue;
    const value = selections[group.key];
    const values = Array.isArray(value) ? value : value ? [value] : [];
    for (const option of group.options) {
      if (values.includes(option.value)) chosen.push({ group, option });
    }
  }
  return chosen;
}

/** Readable label/value pairs for order pages (option values → labels; lists joined). */
export function describeSelections(
  groups: OptionGroup[] | null,
  selections: Selections,
): { label: string; value: string }[] {
  const asText = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value.join(", ") : (value ?? "");

  if (!groups) {
    // Product was deleted: fall back to the raw keys.
    return Object.entries(selections)
      .map(([key, value]) => ({ label: key, value: asText(value) }))
      .filter((item) => item.value);
  }

  return groups
    .map((group) => {
      const value = selections[group.key];
      if (!isChoiceGroup(group)) return { label: group.label, value: asText(value) };
      const values = Array.isArray(value) ? value : value ? [value] : [];
      const labels = values.map((v) => group.options.find((o) => o.value === v)?.label ?? v);
      return { label: group.label, value: labels.join(", ") };
    })
    .filter((item) => item.value);
}
