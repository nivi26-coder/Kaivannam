export const OCCASIONS = [
  { slug: "birthday", label: "Birthday", tamil: "பிறந்தநாள்" },
  { slug: "anniversary", label: "Anniversary", tamil: "திருமண நாள்" },
  { slug: "wedding", label: "Wedding", tamil: "திருமணம்" },
  { slug: "baby", label: "New baby", tamil: "குழந்தை" },
  { slug: "rakhi", label: "Rakhi", tamil: "ராக்கி" },
  { slug: "diwali", label: "Diwali", tamil: "தீபாவளி" },
  { slug: "valentines", label: "Valentine's", tamil: "காதலர் தினம்" },
  { slug: "pongal", label: "Pongal", tamil: "பொங்கல்" },
] as const;

export type OccasionSlug = (typeof OCCASIONS)[number]["slug"];

export const OCCASION_SLUGS = OCCASIONS.map((o) => o.slug) as OccasionSlug[];

export function isOccasionSlug(value: unknown): value is OccasionSlug {
  return typeof value === "string" && (OCCASION_SLUGS as string[]).includes(value);
}

export function getOccasion(slug: OccasionSlug) {
  return OCCASIONS.find((o) => o.slug === slug)!;
}
