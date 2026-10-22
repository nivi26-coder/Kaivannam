// Validation for the per-product customization fields.
// Used by the form for instant feedback and, more importantly, by the
// createOrder server action: client-side checks are a convenience, the
// server check is the one that counts.

import type { CustomField, CustomInputs } from "./types";

export const MAX_TEXT_LENGTH = 200;

export type FieldErrors = Record<string, string>;

export function validateInputs(fields: CustomField[], inputs: CustomInputs): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of fields) {
    const value = (inputs[field.key] ?? "").trim();

    if (!value) {
      if (field.required) {
        errors[field.key] =
          field.type === "select"
            ? `Please choose ${field.label.toLowerCase()}.`
            : field.type === "image"
              ? "Please add a photo."
              : `Please fill in ${field.label.toLowerCase()}.`;
      }
      continue;
    }

    if (field.type === "select" && !field.options.some((option) => option.value === value)) {
      errors[field.key] = "Please choose one of the listed options.";
    }

    if (field.type !== "select" && value.length > MAX_TEXT_LENGTH) {
      errors[field.key] = `Please keep this under ${MAX_TEXT_LENGTH} characters.`;
    }
  }

  return errors;
}

/** The default value for each field: first option for selects, empty otherwise. */
export function getInitialInputs(fields: CustomField[]): CustomInputs {
  return Object.fromEntries(
    fields.map((field) => [
      field.key,
      field.type === "select" && field.required ? (field.options[0]?.value ?? "") : "",
    ]),
  );
}

/** Turns stored inputs into readable label/value pairs (select values -> option labels). */
export function describeInputs(
  fields: CustomField[] | null,
  inputs: CustomInputs,
): { label: string; value: string }[] {
  if (!fields) {
    // Product was deleted: fall back to the raw keys.
    return Object.entries(inputs)
      .filter(([, value]) => value)
      .map(([key, value]) => ({ label: key, value }));
  }

  return fields
    .filter((field) => inputs[field.key])
    .map((field) => {
      const raw = inputs[field.key];
      const option = field.options.find((o) => o.value === raw);
      return { label: field.label, value: option?.label ?? raw };
    });
}
