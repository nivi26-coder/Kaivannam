// Read-only data access for Server Components (pages).
//
// Every function first calls `await io()`. With Cache Components
// (next.config.ts), Next.js tries to prerender each page at build time.
// `io()` tells it "real I/O follows": prerendering stops here, the
// surrounding <Suspense> fallback goes into the static shell, and the read
// runs per request. Data is always fresh (order statuses change constantly)
// and `next build` never touches the database.
//
// Writes don't come through here: they go Server Action -> service.

import "server-only";
import { io } from "next/cache";
import type { OccasionSlug } from "@/domain/occasions";
import type { Creator, OrderWithDetails, Product, ProductWithCreator } from "@/domain/types";
import { getRepositories } from "./repositories";

// --------------------------------------------------------------- creators

export async function getFeaturedCreators(limit = 6): Promise<Creator[]> {
  await io();
  return getRepositories().creators.listFeatured(limit);
}

export async function getAllCreators(): Promise<Creator[]> {
  await io();
  return getRepositories().creators.list();
}

/** Null for unknown ids, including ones that aren't valid ObjectIds. */
export async function getCreator(id: string): Promise<Creator | null> {
  await io();
  return getRepositories().creators.findById(id);
}

/** Orders delivered through the platform: a trust signal on the profile. */
export async function getCompletedOrderCount(creatorId: string): Promise<number> {
  await io();
  return getRepositories().orders.countCompletedByCreator(creatorId);
}

// --------------------------------------------------------------- products

export async function getProducts(
  options: { occasion?: OccasionSlug; limit?: number } = {},
): Promise<ProductWithCreator[]> {
  await io();
  return getRepositories().products.list({ occasion: options.occasion, limit: options.limit ?? 24 });
}

export async function getCreatorProducts(creatorId: string): Promise<Product[]> {
  await io();
  return getRepositories().products.listByCreator(creatorId);
}

export async function getProduct(id: string): Promise<ProductWithCreator | null> {
  await io();
  return getRepositories().products.findById(id);
}

// ----------------------------------------------------------------- orders

export async function getOrder(id: string): Promise<OrderWithDetails | null> {
  await io();
  return getRepositories().orders.findById(id);
}

/** All of a creator's orders, soonest dispatch deadline first. */
export async function getCreatorOrders(creatorId: string): Promise<OrderWithDetails[]> {
  await io();
  return getRepositories().orders.listByCreator(creatorId);
}
