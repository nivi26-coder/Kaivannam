// Read-only data access for Server Components.
//
// Every function first calls `await io()`. With Cache Components
// (next.config.ts), Next.js tries to prerender each page at build time.
// `io()` tells it "real I/O follows": prerendering stops here, the
// surrounding <Suspense> fallback goes into the static shell, and the read
// runs per request. Data is always fresh (order statuses change constantly)
// and `next build` never touches the database.
//
// Where the data comes from (Atlas or in-memory demo data) is decided by
// getStore(); see lib/store/index.ts.

import "server-only";
import { io } from "next/cache";
import type { OccasionSlug } from "./occasions";
import { getStore } from "./store";
import type {
  ArtistDTO,
  OrderWithDetails,
  ProductDTO,
  ProductWithArtist,
} from "./types";

// ---------------------------------------------------------------- artists

export async function getFeaturedArtists(limit = 6): Promise<ArtistDTO[]> {
  await io();
  return getStore().listFeaturedArtists(limit);
}

export async function getAllArtists(): Promise<ArtistDTO[]> {
  await io();
  return getStore().listArtists();
}

/** Null for unknown ids, including ones that aren't valid ObjectIds. */
export async function getArtist(id: string): Promise<ArtistDTO | null> {
  await io();
  return getStore().findArtist(id);
}

/** Orders delivered through the platform: a trust signal on the profile. */
export async function getCompletedOrderCount(artistId: string): Promise<number> {
  await io();
  return getStore().countCompletedOrders(artistId);
}

// --------------------------------------------------------------- products

export async function getProducts(
  options: { occasion?: OccasionSlug; limit?: number } = {},
): Promise<ProductWithArtist[]> {
  await io();
  return getStore().listProducts({ occasion: options.occasion, limit: options.limit ?? 24 });
}

export async function getArtistProducts(artistId: string): Promise<ProductDTO[]> {
  await io();
  return getStore().listArtistProducts(artistId);
}

export async function getProduct(id: string): Promise<ProductWithArtist | null> {
  await io();
  return getStore().findProduct(id);
}

// ----------------------------------------------------------------- orders

export async function getOrder(id: string): Promise<OrderWithDetails | null> {
  await io();
  return getStore().findOrder(id);
}

/** All of an artist's orders, soonest deadline first. */
export async function getArtistOrders(artistId: string): Promise<OrderWithDetails[]> {
  await io();
  return getStore().listArtistOrders(artistId);
}
