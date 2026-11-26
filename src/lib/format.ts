const inrWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Paise → rupees for display: 119900 → "₹1,199", 59950 → "₹599.50".
 * Paise are shown only when there are some.
 */
export function formatINR(paise: number): string {
  const formatter = paise % 100 === 0 ? inrWhole : inrPaise;
  return formatter.format(paise / 100);
}

/** A short, readable order reference from its id, e.g. "#4F2A9C". */
export function orderRef(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
