// Calendar dates in Indian time (IST).
//
// Why: the server (Vercel) runs in UTC. Between midnight and 5:30 am IST the
// UTC date is still "yesterday", so naive `new Date()` maths would show
// buyers the wrong dates. Calendar days are passed around as "YYYY-MM-DD"
// strings and only converted to Date at the edges.
//
// Business rules built on these (earliest delivery date and so on) live in
// src/domain/delivery.ts.

const IST = "Asia/Kolkata";

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

/** Midnight IST on the given day, for storing in the database. */
export function ymdToDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00+05:30`);
}

export function isValidYmd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** "Mon, 3 Nov" (or with the year when asked). */
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
