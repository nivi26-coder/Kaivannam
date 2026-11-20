import "server-only";
import { isValidObjectId } from "mongoose";
import type { ArtistSummary, Product, ProductWithArtist } from "@/domain/types";
import { connectDB } from "@/server/db/connect";
import { ProductModel } from "@/server/db/models/product.model";
import type { ProductRepository } from "../types";
import { serialize } from "./serialize";

const ARTIST_SUMMARY_FIELDS = "name city avatarUrl isVerified isAcceptingOrders makingTimeDays";

type PopulatedProduct = Omit<Product, "artistId"> & { artistId: ArtistSummary | null };

function withArtist(product: PopulatedProduct): ProductWithArtist | null {
  // populate() gives null if the artist was deleted; hide those products.
  if (!product.artistId) return null;
  return { ...product, artistId: product.artistId._id, artist: product.artistId };
}

export const mongoProductRepository: ProductRepository = {
  async list({ occasion, limit }) {
    await connectDB();
    const products = await ProductModel.find(occasion ? { occasionTags: occasion } : {})
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate("artistId", ARTIST_SUMMARY_FIELDS)
      .lean();
    return serialize<PopulatedProduct[]>(products)
      .map(withArtist)
      .filter((product): product is ProductWithArtist => product !== null);
  },

  async listByArtist(artistId) {
    if (!isValidObjectId(artistId)) return [];
    await connectDB();
    return serialize<Product[]>(await ProductModel.find({ artistId }).sort({ createdAt: 1 }).lean());
  },

  async findById(id) {
    if (!isValidObjectId(id)) return null;
    await connectDB();
    const product = await ProductModel.findById(id).populate("artistId", ARTIST_SUMMARY_FIELDS).lean();
    return product ? withArtist(serialize<PopulatedProduct>(product)) : null;
  },
};
