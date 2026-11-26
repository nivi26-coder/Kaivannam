import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const creatorSchema = new Schema(
  {
    handle: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    bio: { type: String, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, default: "Tamil Nadu" },
    avatarUrl: { type: String, default: "" },
    categories: { type: [String], default: [] },
    /** The "pause" toggle: creators switch this off during busy seasons. */
    isAcceptingOrders: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type CreatorDoc = InferSchemaType<typeof creatorSchema>;

// `models.Creator ||` reuses the model if this file is evaluated again
// (hot reload), avoiding "Cannot overwrite model once compiled" errors.
export const CreatorModel =
  (models.Creator as Model<CreatorDoc> | undefined) || model<CreatorDoc>("Creator", creatorSchema);
