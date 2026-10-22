// Dates are always reasoned about in Indian time (IST).
//
// Why: the server (Vercel) runs in UTC. Between midnight and 5:30 am IST the
// UTC date is still "yesterday", so naive `new Date()` maths would give buyers
// the wrong earliest delivery date. Delivery dates are calendar days, so we
// pass them around as "YYYY-MM-DD" strings and only convert at the edges.

const IST = "Asia/Kolkata";

/** Days we allow for courier delivery after the artist finishes making. */
export const SHIPPING_DAYS = 2;

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's date in India as "YYYY-MM-DD". Only call at request time. */
export function todayIST(): string {
  return ymdFormatter.format(new Date());
}

/** The calendar date (in India) of a stored Date, as "YYYY-MM-DD". */
export function toYmdIST(date: Date | string): string {
  return ymdFormatter.format(new Date(date));
}

export function addDays(ymd: string, days: number): string {
  const date = new Date(`${ymd}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(fromYmd: string, toYmd: string): number {
  const ms = Date.parse(`${toYmd}T00:00:00Z`) - Date.parse(`${fromYmd}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Midnight IST on the given day, for storing in MongoDB. */
export function ymdToDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00+05:30`);
}

export function isValidYmd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Earliest date an artist can deliver if the order is placed today. */
export function earliestDeliveryYmd(makingTimeDays: number): string {
  return addDays(todayIST(), makingTimeDays + SHIPPING_DAYS);
}

/** "Mon, 3 Nov" (or with the year when it's not this year). */
export function formatDate(value: Date | string, opts: { withYear?: boolean } = {}): string {
  const date = typeof value === "string" && isValidYmd(value) ? ymdToDate(value) : new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(opts.withYear ? { year: "numeric" } : {}),
  }).format(date);
}
