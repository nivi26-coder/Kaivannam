import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ORDER_STATUSES } from "../lib/orderStatus";

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

// A copy of the product as it was when ordered. If the artist later renames
// the product, changes its price or its revision limit, past orders don't change.
const productSnapshotSchema = new Schema(
  {
    title: { type: String, required: true },
    basePrice: { type: Number, required: true },
    imageUrl: { type: String, default: "" },
    maxRevisions: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    // Demo: no login yet, so the buyer is identified by name and phone.
    buyerName: { type: String, required: true, trim: true },
    buyerPhone: { type: String, required: true },
    artistId: { type: Schema.Types.ObjectId, ref: "Artist", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productSnapshot: { type: productSnapshotSchema, required: true },
    inputs: { type: Map, of: String, default: {} },
    /** Calculated on the server with calculatePrice(). Never taken from the browser. */
    totalPrice: { type: Number, required: true, min: 0, validate: Number.isInteger },
    deliverBy: { type: Date, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "PLACED", index: true },
    previews: { type: [previewSchema], default: [] },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof orderSchema>;

export const Order =
  (models.Order as Model<OrderDoc> | undefined) || model<OrderDoc>("Order", orderSchema);
