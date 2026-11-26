import type { Creator, CreatorSummary, Order, OrderWithDetails, Product, ProductWithCreator } from "@/domain/types";
import { buildDemoData } from "@/server/demo-data";

/** The in-memory "database": plain arrays of domain objects. */
export interface MockDatabase {
  creators: Creator[];
  products: Product[];
  orders: Order[];
}

/** A fresh copy of the demo data, with dates relative to `now`. */
export function createMockDatabase(now: Date = new Date()): MockDatabase {
  const { creators, products, orders } = buildDemoData(now);
  return { creators, products, orders };
}

/** Hand out copies, so callers can't accidentally edit the "database". */
export const copy = <T>(value: T): T => structuredClone(value);

export const byCreatedAt = (a: { createdAt: string }, b: { createdAt: string }) =>
  a.createdAt.localeCompare(b.createdAt);

export function toSummary(creator: Creator): CreatorSummary {
  const { _id, handle, name, city, avatarUrl, isVerified, isAcceptingOrders } = creator;
  return { _id, handle, name, city, avatarUrl, isVerified, isAcceptingOrders };
}

/** The mock equivalent of populating a product's creator. */
export function withCreator(db: MockDatabase, product: Product): ProductWithCreator | null {
  const creator = db.creators.find((c) => c._id === product.creatorId);
  return creator ? copy({ ...product, creator: toSummary(creator) }) : null;
}

/** The mock equivalent of populating an order's creator and product. */
export function withDetails(db: MockDatabase, order: Order): OrderWithDetails {
  const creator = db.creators.find((c) => c._id === order.creatorId);
  const product = db.products.find((p) => p._id === order.productId);
  return copy({
    ...order,
    creator: creator ? { _id: creator._id, name: creator.name, city: creator.city } : null,
    optionGroups: product?.optionGroups ?? null,
  });
}
