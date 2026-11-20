import type { Artist, ArtistSummary, Order, OrderWithDetails, Product, ProductWithArtist } from "@/domain/types";
import { buildDemoData } from "@/server/demo-data";

/** The in-memory "database": plain arrays of domain objects. */
export interface MockDatabase {
  artists: Artist[];
  products: Product[];
  orders: Order[];
}

/** A fresh copy of the demo data, with dates relative to `now`. */
export function createMockDatabase(now: Date = new Date()): MockDatabase {
  const { artists, products, orders } = buildDemoData(now);
  return { artists, products, orders };
}

/** Hand out copies, so callers can't accidentally edit the "database". */
export const copy = <T>(value: T): T => structuredClone(value);

export const byCreatedAt = (a: { createdAt: string }, b: { createdAt: string }) =>
  a.createdAt.localeCompare(b.createdAt);

export function toSummary(artist: Artist): ArtistSummary {
  const { _id, name, city, avatarUrl, isVerified, isAcceptingOrders, makingTimeDays } = artist;
  return { _id, name, city, avatarUrl, isVerified, isAcceptingOrders, makingTimeDays };
}

/** The mock equivalent of Mongo's populate("artistId"). */
export function withArtist(db: MockDatabase, product: Product): ProductWithArtist | null {
  const artist = db.artists.find((a) => a._id === product.artistId);
  return artist ? copy({ ...product, artist: toSummary(artist) }) : null;
}

/** The mock equivalent of populating an order's artist and product. */
export function withDetails(db: MockDatabase, order: Order): OrderWithDetails {
  const artist = db.artists.find((a) => a._id === order.artistId);
  const product = db.products.find((p) => p._id === order.productId);
  return copy({
    ...order,
    artist: artist ? { _id: artist._id, name: artist.name, city: artist.city } : null,
    customFields: product?.customFields ?? null,
  });
}
