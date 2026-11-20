import "server-only";
import { isValidObjectId } from "mongoose";
import type { Artist } from "@/domain/types";
import { connectDB } from "@/server/db/connect";
import { ArtistModel } from "@/server/db/models/artist.model";
import type { ArtistRepository } from "../types";
import { serialize } from "./serialize";

export const mongoArtistRepository: ArtistRepository = {
  async listFeatured(limit) {
    await connectDB();
    const artists = await ArtistModel.find()
      .sort({ isVerified: -1, isAcceptingOrders: -1, createdAt: 1 })
      .limit(limit)
      .lean();
    return serialize<Artist[]>(artists);
  },

  async list() {
    await connectDB();
    return serialize<Artist[]>(await ArtistModel.find().sort({ name: 1 }).lean());
  },

  async findById(id) {
    if (!isValidObjectId(id)) return null;
    await connectDB();
    const artist = await ArtistModel.findById(id).lean();
    return artist ? serialize<Artist>(artist) : null;
  },

  async setAcceptingOrders(id, accepting) {
    if (!isValidObjectId(id)) return;
    await connectDB();
    await ArtistModel.updateOne({ _id: id }, { $set: { isAcceptingOrders: accepting } });
  },
};
