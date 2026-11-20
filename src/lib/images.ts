/**
 * Sizing params for Unsplash's CDN: ask for a ~1200px version so next/image
 * doesn't download the multi-megabyte original before resizing it.
 * next.config.ts allows exactly this query string and no other.
 */
export const UNSPLASH_PARAMS = "?w=1200&q=80&auto=format&fit=crop";

/** Unsplash photo URL for demo data. */
export function unsplash(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}${UNSPLASH_PARAMS}`;
}
