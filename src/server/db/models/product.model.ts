import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { OCCASION_SLUGS } from "@/domain/occasions";

// Option groups live inside the product document: each product has its own
// form. Their full rules are checked in domain/product-options.ts before
// saving; the schema only guards the basic shape.

const choiceSchema = new Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    /** Integer paise; can be 0 or negative. */
    pricePaise: { type: Number, default: 0, validate: Number.isInteger },
    extraDays: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const optionGroupSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ["single", "multi", "text", "photo"], required: true },
    required: { type: Boolean },
    options: { type: [choiceSchema], default: undefined },
    min: { type: Number },
    max: { type: Number },
    maxLength: { type: Number },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: "Creator", required: true, index: true },
    slug: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    occasionTags: { type: [{ type: String, enum: OCCASION_SLUGS }], default: [], index: true },
    /** Integer paise (₹1 = 100). */
    basePricePaise: { type: Number, required: true, min: 0, validate: Number.isInteger },
    baseProductionDays: { type: Number, required: true, min: 1 },
    optionGroups: { type: [optionGroupSchema], default: [] },
    maxRevisions: { type: Number, default: 2, min: 0 },
    /** Null when the product has no paid mockup. */
    mockupFeePaise: { type: Number, default: null },
    advancePercent: { type: Number, required: true, min: 20, max: 60 },
    weightGrams: { type: Number, required: true, min: 1 },
    packageCm: {
      length: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
    },
    isListed: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ProductDoc = InferSchemaType<typeof productSchema>;

export const ProductModel =
  (models.Product as Model<ProductDoc> | undefined) || model<ProductDoc>("Product", productSchema);
