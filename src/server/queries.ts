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
import type { Artist, OrderWithDetails, Product, ProductWithArtist } from "@/domain/types";
import { getRepositories } from "./repositories";

// ---------------------------------------------------------------- artists

export async function getFeaturedArtists(limit = 6): Promise<Artist[]> {
  await io();
  return getRepositories().artists.listFeatured(limit);
}

export async function getAllArtists(): Promise<Artist[]> {
  await io();
  return getRepositories().artists.list();
}

/** Null for unknown ids, including ones that aren't valid ObjectIds. */
export async function getArtist(id: string): Promise<Artist | null> {
  await io();
  return getRepositories().artists.findById(id);
}

/** Orders delivered through the platform: a trust signal on the profile. */
export async function getCompletedOrderCount(artistId: string): Promise<number> {
  await io();
  return getRepositories().orders.countCompletedByArtist(artistId);
}

// --------------------------------------------------------------- products

export async function getProducts(
  options: { occasion?: OccasionSlug; limit?: number } = {},
): Promise<ProductWithArtist[]> {
  await io();
  return getRepositories().products.list({ occasion: options.occasion, limit: options.limit ?? 24 });
}

export async function getArtistProducts(artistId: string): Promise<Product[]> {
  await io();
  return getRepositories().products.listByArtist(artistId);
}

export async function getProduct(id: string): Promise<ProductWithArtist | null> {
  await io();
  return getRepositories().products.findById(id);
}

// ----------------------------------------------------------------- orders

export async function getOrder(id: string): Promise<OrderWithDetails | null> {
  await io();
  return getRepositories().orders.findById(id);
}

/** All of an artist's orders, soonest deadline first. */
export async function getArtistOrders(artistId: string): Promise<OrderWithDetails[]> {
  await io();
  return getRepositories().orders.listByArtist(artistId);
}
