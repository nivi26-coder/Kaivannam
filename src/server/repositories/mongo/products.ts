import "server-only";
import { isValidObjectId } from "mongoose";
import type { CreatorSummary, Product, ProductWithCreator } from "@/domain/types";
import { connectDB } from "@/server/db/connect";
import { ProductModel } from "@/server/db/models/product.model";
import type { ProductRepository } from "../types";
import { serialize } from "./serialize";

const CREATOR_SUMMARY_FIELDS = "handle name city avatarUrl isVerified isAcceptingOrders";

type PopulatedProduct = Omit<Product, "creatorId"> & { creatorId: CreatorSummary | null };

function withCreator(product: PopulatedProduct): ProductWithCreator | null {
  // populate() gives null if the creator was deleted; hide those products.
  if (!product.creatorId) return null;
  return { ...product, creatorId: product.creatorId._id, creator: product.creatorId };
}

export const mongoProductRepository: ProductRepository = {
  async list({ occasion, limit }) {
    await connectDB();
    const products = await ProductModel.find({ isListed: true, ...(occasion ? { occasionTags: occasion } : {}) })
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate("creatorId", CREATOR_SUMMARY_FIELDS)
      .lean();
    return serialize<PopulatedProduct[]>(products)
      .map(withCreator)
      .filter((product): product is ProductWithCreator => product !== null);
  },

  async listByCreator(creatorId) {
    if (!isValidObjectId(creatorId)) return [];
    await connectDB();
    return serialize<Product[]>(await ProductModel.find({ creatorId, isListed: true }).sort({ createdAt: 1 }).lean());
  },

  async findById(id) {
    if (!isValidObjectId(id)) return null;
    await connectDB();
    const product = await ProductModel.findById(id).populate("creatorId", CREATOR_SUMMARY_FIELDS).lean();
    return product ? withCreator(serialize<PopulatedProduct>(product)) : null;
  },
};
