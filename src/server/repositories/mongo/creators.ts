import "server-only";
import { isValidObjectId } from "mongoose";
import type { Creator } from "@/domain/types";
import { connectDB } from "@/server/db/connect";
import { CreatorModel } from "@/server/db/models/creator.model";
import type { CreatorRepository } from "../types";
import { serialize } from "./serialize";

export const mongoCreatorRepository: CreatorRepository = {
  async listFeatured(limit) {
    await connectDB();
    const creators = await CreatorModel.find()
      .sort({ isVerified: -1, isAcceptingOrders: -1, createdAt: 1 })
      .limit(limit)
      .lean();
    return serialize<Creator[]>(creators);
  },

  async list() {
    await connectDB();
    return serialize<Creator[]>(await CreatorModel.find().sort({ name: 1 }).lean());
  },

  async findById(id) {
    if (!isValidObjectId(id)) return null;
    await connectDB();
    const creator = await CreatorModel.findById(id).lean();
    return creator ? serialize<Creator>(creator) : null;
  },

  async setAcceptingOrders(id, accepting) {
    if (!isValidObjectId(id)) return;
    await connectDB();
    await CreatorModel.updateOne({ _id: id }, { $set: { isAcceptingOrders: accepting } });
  },
};
