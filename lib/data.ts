// Read-only data access for Server Components.
//
// Two things every function here does first:
//
// 1. `await io()` — with Cache Components (next.config.ts), Next.js tries to
//    prerender each page at build time. `io()` tells it "real I/O follows":
//    prerendering stops here, the surrounding <Suspense> fallback goes into
//    the static shell, and the query runs per request. This keeps the demo's
//    data always fresh (order statuses change constantly) and means
//    `next build` never needs a database connection.
//
// 2. Return plain objects — Mongo documents contain ObjectIds and Dates,
//    which can't be passed to Client Components. `.lean()` skips building
//    full Mongoose documents, and serialize() turns the rest into strings.

import "server-only";
import { isValidObjectId } from "mongoose";
import { io } from "next/cache";
import { Artist } from "@/models/Artist";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { connectDB } from "./db";
import type { OccasionSlug } from "./occasions";
import type {
  ArtistDTO,
  ArtistSummary,
  CustomField,
  OrderDTO,
  OrderWithDetails,
  ProductDTO,
  ProductWithArtist,
} from "./types";

function serialize<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function ready() {
  await io();
  await connectDB();
}

const ARTIST_SUMMARY_FIELDS = "name city avatarUrl isVerified isAcceptingOrders makingTimeDays";

type PopulatedProduct = Omit<ProductDTO, "artistId"> & { artistId: ArtistSummary | null };

function withArtist(product: PopulatedProduct): ProductWithArtist | null {
  // populate() gives null if the artist was deleted; hide those products.
  if (!product.artistId) return null;
  return { ...product, artistId: product.artistId._id, artist: product.artistId };
}

// ---------------------------------------------------------------- artists

export async function getFeaturedArtists(limit = 6): Promise<ArtistDTO[]> {
  await ready();
  const artists = await Artist.find()
    .sort({ isVerified: -1, isAcceptingOrders: -1, createdAt: 1 })
    .limit(limit)
    .lean();
  return serialize(artists);
}

export async function getAllArtists(): Promise<ArtistDTO[]> {
  await ready();
  const artists = await Artist.find().sort({ name: 1 }).lean();
  return serialize(artists);
}

export async function getArtist(id: string): Promise<ArtistDTO | null> {
  await ready();
  if (!isValidObjectId(id)) return null;
  const artist = await Artist.findById(id).lean();
  return artist ? serialize(artist) : null;
}

/** Orders delivered through the platform: a trust signal on the profile. */
export async function getCompletedOrderCount(artistId: string): Promise<number> {
  await ready();
  return Order.countDocuments({ artistId, status: { $in: ["DELIVERED", "PAYOUT_RELEASED"] } });
}

// --------------------------------------------------------------- products

export async function getProducts(
  options: { occasion?: OccasionSlug; limit?: number } = {},
): Promise<ProductWithArtist[]> {
  await ready();
  const filter = options.occasion ? { occasionTags: options.occasion } : {};
  const products = await Product.find(filter)
    .sort({ createdAt: 1 })
    .limit(options.limit ?? 24)
    .populate("artistId", ARTIST_SUMMARY_FIELDS)
    .lean();
  return serialize<PopulatedProduct[]>(products)
    .map(withArtist)
    .filter((product): product is ProductWithArtist => product !== null);
}

export async function getArtistProducts(artistId: string): Promise<ProductDTO[]> {
  await ready();
  const products = await Product.find({ artistId }).sort({ createdAt: 1 }).lean();
  return serialize(products);
}

export async function getProduct(id: string): Promise<ProductWithArtist | null> {
  await ready();
  if (!isValidObjectId(id)) return null;
  const product = await Product.findById(id).populate("artistId", ARTIST_SUMMARY_FIELDS).lean();
  return product ? withArtist(serialize<PopulatedProduct>(product)) : null;
}

// ----------------------------------------------------------------- orders

type PopulatedOrder = Omit<OrderDTO, "artistId" | "productId"> & {
  artistId: { _id: string; name: string; city: string } | null;
  productId: { _id: string; customFields: CustomField[] } | null;
};

function withDetails(order: PopulatedOrder): OrderWithDetails {
  return {
    ...order,
    artistId: order.artistId?._id ?? "",
    productId: order.productId?._id ?? "",
    artist: order.artistId,
    customFields: order.productId?.customFields ?? null,
  };
}

export async function getOrder(id: string): Promise<OrderWithDetails | null> {
  await ready();
  if (!isValidObjectId(id)) return null;
  const order = await Order.findById(id)
    .populate("artistId", "name city")
    .populate("productId", "customFields")
    .lean();
  return order ? withDetails(serialize<PopulatedOrder>(order)) : null;
}

/** All of an artist's orders, soonest deadline first. */
export async function getArtistOrders(artistId: string): Promise<OrderWithDetails[]> {
  await ready();
  if (!isValidObjectId(artistId)) return [];
  const orders = await Order.find({ artistId })
    .sort({ deliverBy: 1 })
    .populate("artistId", "name city")
    .populate("productId", "customFields")
    .lean();
  return serialize<PopulatedOrder[]>(orders).map(withDetails);
}
