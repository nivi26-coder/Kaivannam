/** A form field as a string ("" when missing or when it's a file). */
export function getString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** All fields named `<prefix><key>`, as { key: value }. */
export function getPrefixed(formData: FormData, prefix: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [name, value] of formData) {
    if (name.startsWith(prefix) && typeof value === "string") {
      values[name.slice(prefix.length)] = value;
    }
  }
  return values;
}
