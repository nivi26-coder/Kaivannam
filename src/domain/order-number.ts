// Readable order numbers (ROOM-6): KV-<YYMM>-<5-digit sequence>, e.g. KV-2611-00042.
// The sequence comes from the database; this module only formats and checks.

/** formatOrderNumber("2026-11-26", 42) → "KV-2611-00042" */
export function formatOrderNumber(placedOnYmd: string, sequence: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(placedOnYmd)) throw new RangeError(`Not a date: ${placedOnYmd}`);
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 99999) {
    throw new RangeError(`Order sequence must be 1–99999: ${sequence}`);
  }
  const yymm = placedOnYmd.slice(2, 4) + placedOnYmd.slice(5, 7);
  return `KV-${yymm}-${String(sequence).padStart(5, "0")}`;
}

export function isOrderNumber(value: string): boolean {
  return /^KV-\d{4}-\d{5}$/.test(value);
}
