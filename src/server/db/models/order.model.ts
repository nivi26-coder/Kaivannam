import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ORDER_STATUSES } from "@/domain/order-status";

const previewSchema = new Schema(
  {
    imageUrl: { type: String, required: true },
    round: { type: Number, required: true, min: 1 },
    response: {
      type: String,
      enum: ["pending", "approved", "changes_requested"],
      default: "pending",
    },
    comment: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// A copy of the product as it was when ordered. If the creator later renames
// the product, changes its price or its revision limit, past orders don't change.
const productSnapshotSchema = new Schema(
  {
    title: { type: String, required: true },
    basePricePaise: { type: Number, required: true },
    baseProductionDays: { type: Number, required: true },
    imageUrl: { type: String, default: "" },
    maxRevisions: { type: Number, required: true },
  },
  { _id: false },
);

// Each chosen option's price and extra days, as they were when ordered.
const priceLineSchema = new Schema(
  {
    label: { type: String, required: true },
    amountPaise: { type: Number, required: true, validate: Number.isInteger },
    extraDays: { type: Number, default: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    // Demo: no login yet, so the buyer is identified by name and phone.
    buyerName: { type: String, required: true, trim: true },
    buyerPhone: { type: String, required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: "Creator", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productSnapshot: { type: productSnapshotSchema, required: true },
    /** The buyer's choices: a string per group, or a list for multi-choice. */
    selections: { type: Schema.Types.Mixed, default: {} },
    priceLines: { type: [priceLineSchema], default: [] },
    /** Integer paise, calculated on the server with quoteItem(). Never taken from the browser. */
    itemTotalPaise: { type: Number, required: true, min: 0, validate: Number.isInteger },
    productionDays: { type: Number, required: true, min: 0 },
    dispatchBy: { type: Date, required: true },
    estimatedDelivery: { type: Date, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "PLACED", index: true },
    previews: { type: [previewSchema], default: [] },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof orderSchema>;

export const OrderModel =
  (models.Order as Model<OrderDoc> | undefined) || model<OrderDoc>("Order", orderSchema);
