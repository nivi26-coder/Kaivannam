// Store backed by MongoDB Atlas (Mongoose).
//
// Reads use `.lean()` (plain objects instead of full Mongoose documents) and
// serialize() (ObjectIds and Dates -> strings), because Mongo documents can't
// be passed to Client Components.

import "server-only";
import { isValidObjectId } from "mongoose";
import { Artist } from "@/models/Artist";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { connectDB } from "../db";
import type {
  ArtistSummary,
  CustomField,
  OrderDTO,
  OrderWithDetails,
  ProductDTO,
  ProductWithArtist,
} from "../types";
import { lastPreviewIndex, type Store } from "./types";

function serialize<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const ARTIST_SUMMARY_FIELDS = "name city avatarUrl isVerified isAcceptingOrders makingTimeDays";

type PopulatedProduct = Omit<ProductDTO, "artistId"> & { artistId: ArtistSummary | null };

function withArtist(product: PopulatedProduct): ProductWithArtist | null {
  // populate() gives null if the artist was deleted; hide those products.
  if (!product.artistId) return null;
  return { ...product, artistId: product.artistId._id, artist: product.artistId };
}

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

export const mongoStore: Store = {
  // ---------------------------------------------------------- artists

  async listFeaturedArtists(limit) {
    await connectDB();
    const artists = await Artist.find()
      .sort({ isVerified: -1, isAcceptingOrders: -1, createdAt: 1 })
      .limit(limit)
      .lean();
    return serialize(artists);
  },

  async listArtists() {
    await connectDB();
    return serialize(await Artist.find().sort({ name: 1 }).lean());
  },

  async findArtist(id) {
    if (!isValidObjectId(id)) return null;
    await connectDB();
    const artist = await Artist.findById(id).lean();
    return artist ? serialize(artist) : null;
  },

  async countCompletedOrders(artistId) {
    if (!isValidObjectId(artistId)) return 0;
    await connectDB();
    return Order.countDocuments({ artistId, status: { $in: ["DELIVERED", "PAYOUT_RELEASED"] } });
  },

  async setAcceptingOrders(artistId, accepting) {
    if (!isValidObjectId(artistId)) return;
    await connectDB();
    await Artist.updateOne({ _id: artistId }, { $set: { isAcceptingOrders: accepting } });
  },

  // --------------------------------------------------------- products

  async listProducts({ occasion, limit }) {
    await connectDB();
    const products = await Product.find(occasion ? { occasionTags: occasion } : {})
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate("artistId", ARTIST_SUMMARY_FIELDS)
      .lean();
    return serialize<PopulatedProduct[]>(products)
      .map(withArtist)
      .filter((product): product is ProductWithArtist => product !== null);
  },

  async listArtistProducts(artistId) {
    if (!isValidObjectId(artistId)) return [];
    await connectDB();
    return serialize(await Product.find({ artistId }).sort({ createdAt: 1 }).lean());
  },

  async findProduct(id) {
    if (!isValidObjectId(id)) return null;
    await connectDB();
    const product = await Product.findById(id).populate("artistId", ARTIST_SUMMARY_FIELDS).lean();
    return product ? withArtist(serialize<PopulatedProduct>(product)) : null;
  },

  // ----------------------------------------------------------- orders

  async findOrder(id) {
    if (!isValidObjectId(id)) return null;
    await connectDB();
    const order = await Order.findById(id)
      .populate("artistId", "name city")
      .populate("productId", "customFields")
      .lean();
    return order ? withDetails(serialize<PopulatedOrder>(order)) : null;
  },

  async listArtistOrders(artistId) {
    if (!isValidObjectId(artistId)) return [];
    await connectDB();
    const orders = await Order.find({ artistId })
      .sort({ deliverBy: 1 })
      .populate("artistId", "name city")
      .populate("productId", "customFields")
      .lean();
    return serialize<PopulatedOrder[]>(orders).map(withDetails);
  },

  async insertOrder(order) {
    await connectDB();
    const created = await Order.create({ ...order, status: "PLACED" });
    return created._id.toString();
  },

  // A single updateOne whose filter includes the expected state. MongoDB
  // applies it atomically: it either matches and updates, or does nothing.
  async updateOrderIf(id, condition, change) {
    if (!isValidObjectId(id)) return false;
    await connectDB();

    const filter: Record<string, unknown> = {
      _id: id,
      status: Array.isArray(condition.status) ? { $in: condition.status } : condition.status,
    };
    if (condition.previewCount !== undefined) {
      filter.previews = { $size: condition.previewCount };
    }
    if (condition.lastPreviewResponse) {
      filter[`previews.${lastPreviewIndex(condition)}.response`] = condition.lastPreviewResponse;
    }

    const set: Record<string, unknown> = {};
    if (change.status) set.status = change.status;
    if (change.answerLastPreview) {
      const last = lastPreviewIndex(condition);
      set[`previews.${last}.response`] = change.answerLastPreview.response;
      if (change.answerLastPreview.comment !== undefined) {
        set[`previews.${last}.comment`] = change.answerLastPreview.comment;
      }
    }

    const update: Record<string, unknown> = {};
    if (Object.keys(set).length > 0) update.$set = set;
    if (change.addPreview) update.$push = { previews: change.addPreview };

    const result = await Order.updateOne(filter, update);
    return result.modifiedCount > 0;
  },
};
