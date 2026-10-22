const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** 1299 -> "₹1,299". Prices are stored as whole rupees. */
export function formatINR(rupees: number): string {
  return inr.format(rupees);
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
