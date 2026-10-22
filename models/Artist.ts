import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const artistSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    bio: { type: String, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, default: "Tamil Nadu" },
    avatarUrl: { type: String, default: "" },
    categories: { type: [String], default: [] },
    /** Days the artist needs to make an order, before shipping. */
    makingTimeDays: { type: Number, required: true, min: 1 },
    /** The "pause" toggle: artists switch this off during busy seasons. */
    isAcceptingOrders: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type ArtistDoc = InferSchemaType<typeof artistSchema>;

// `models.Artist ||` reuses the model if this file is evaluated again
// (hot reload), avoiding "Cannot overwrite model once compiled" errors.
export const Artist =
  (models.Artist as Model<ArtistDoc> | undefined) || model<ArtistDoc>("Artist", artistSchema);
