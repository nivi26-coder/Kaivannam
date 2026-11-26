import "server-only";
import { isValidObjectId } from "mongoose";
import type { OptionGroup } from "@/domain/product-options";
import type { Order, OrderWithDetails } from "@/domain/types";
import { connectDB } from "@/server/db/connect";
import { OrderModel } from "@/server/db/models/order.model";
import { lastPreviewIndex, type OrderRepository } from "../types";
import { serialize } from "./serialize";

type PopulatedOrder = Omit<Order, "creatorId" | "productId"> & {
  creatorId: { _id: string; name: string; city: string } | null;
  productId: { _id: string; optionGroups: OptionGroup[] } | null;
};

function withDetails(order: PopulatedOrder): OrderWithDetails {
  return {
    ...order,
    creatorId: order.creatorId?._id ?? "",
    productId: order.productId?._id ?? "",
    creator: order.creatorId,
    optionGroups: order.productId?.optionGroups ?? null,
  };
}

export const mongoOrderRepository: OrderRepository = {
  async findById(id) {
    if (!isValidObjectId(id)) return null;
    await connectDB();
    const order = await OrderModel.findById(id)
      .populate("creatorId", "name city")
      .populate("productId", "optionGroups")
      .lean();
    return order ? withDetails(serialize<PopulatedOrder>(order)) : null;
  },

  async listByCreator(creatorId) {
    if (!isValidObjectId(creatorId)) return [];
    await connectDB();
    const orders = await OrderModel.find({ creatorId })
      .sort({ dispatchBy: 1 })
      .populate("creatorId", "name city")
      .populate("productId", "optionGroups")
      .lean();
    return serialize<PopulatedOrder[]>(orders).map(withDetails);
  },

  async countCompletedByCreator(creatorId) {
    if (!isValidObjectId(creatorId)) return 0;
    await connectDB();
    return OrderModel.countDocuments({ creatorId, status: { $in: ["DELIVERED", "PAYOUT_RELEASED"] } });
  },

  async create(order) {
    await connectDB();
    const created = await OrderModel.create({ ...order, status: "PLACED" });
    return created._id.toString();
  },

  // A single updateOne whose filter includes the expected state. MongoDB
  // applies it atomically: it either matches and updates, or does nothing.
  async updateIf(id, condition, change) {
    if (!isValidObjectId(id)) return false;
    await connectDB();

    const filter: Record<string, unknown> = {
      _id: id,
      status: Array.isArray(condition.status) ? { $in: condition.status } : condition.status,
    };
    if (condition.previewCount !== undefined) {
      filter.previews = { $size: condition.previewCount };
    }
    if (condition.lastPreviewResponse) {
      filter[`previews.${lastPreviewIndex(condition)}.response`] = condition.lastPreviewResponse;
    }

    const set: Record<string, unknown> = {};
    if (change.status) set.status = change.status;
    if (change.answerLastPreview) {
      const last = lastPreviewIndex(condition);
      set[`previews.${last}.response`] = change.answerLastPreview.response;
      if (change.answerLastPreview.comment !== undefined) {
        set[`previews.${last}.comment`] = change.answerLastPreview.comment;
      }
    }

    const update: Record<string, unknown> = {};
    if (Object.keys(set).length > 0) update.$set = set;
    if (change.addPreview) update.$push = { previews: change.addPreview };

    const result = await OrderModel.updateOne(filter, update);
    return result.modifiedCount > 0;
  },
};
