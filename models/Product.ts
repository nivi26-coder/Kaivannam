import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { OCCASION_SLUGS } from "../lib/occasions";

// Custom fields live inside the product document rather than in their own
// collection: each product has a different form, and MongoDB's flexible
// documents make that natural. `_id: false` because these are never
// referenced on their own.

const optionSchema = new Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    priceModifier: { type: Number, default: 0, validate: Number.isInteger },
  },
  { _id: false },
);

const customFieldSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ["text", "image", "select"], required: true },
    required: { type: Boolean, default: false },
    options: { type: [optionSchema], default: [] },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    artistId: { type: Schema.Types.ObjectId, ref: "Artist", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    /** Whole rupees. Razorpay wants paise, so multiply by 100 at payment time. */
    basePrice: { type: Number, required: true, min: 0, validate: Number.isInteger },
    images: { type: [String], default: [] },
    occasionTags: { type: [{ type: String, enum: OCCASION_SLUGS }], default: [], index: true },
    /** How many times the buyer may ask for changes to the preview. */
    maxRevisions: { type: Number, default: 2, min: 0 },
    customFields: { type: [customFieldSchema], default: [] },
  },
  { timestamps: true },
);

export type ProductDoc = InferSchemaType<typeof productSchema>;

export const Product =
  (models.Product as Model<ProductDoc> | undefined) || model<ProductDoc>("Product", productSchema);
