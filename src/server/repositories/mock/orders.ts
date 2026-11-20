import { Types } from "mongoose";
import { lastPreviewIndex, type OrderRepository } from "../types";
import { copy, withDetails, type MockDatabase } from "./database";

export function createMockOrderRepository(db: MockDatabase): OrderRepository {
  return {
    async findById(id) {
      const order = db.orders.find((o) => o._id === id);
      return order ? withDetails(db, order) : null;
    },

    async listByArtist(artistId) {
      return db.orders
        .filter((o) => o.artistId === artistId)
        .sort((a, b) => a.deliverBy.localeCompare(b.deliverBy))
        .map((o) => withDetails(db, o));
    },

    async countCompletedByArtist(artistId) {
      return db.orders.filter(
        (o) =>
          o.artistId === artistId && (o.status === "DELIVERED" || o.status === "PAYOUT_RELEASED"),
      ).length;
    },

    async create(order) {
      const now = new Date().toISOString();
      // A real ObjectId string, so ids look the same as in MongoDB.
      const id = new Types.ObjectId().toString();
      db.orders.push({
        ...copy(order),
        _id: id,
        status: "PLACED",
        previews: [],
        createdAt: now,
        updatedAt: now,
      });
      return id;
    },

    // Check-then-change with no `await` in between: Node runs this to
    // completion before handling another request, so it's as safe as
    // Mongo's conditional update.
    async updateIf(id, condition, change) {
      const order = db.orders.find((o) => o._id === id);
      if (!order) return false;

      const allowed = Array.isArray(condition.status) ? condition.status : [condition.status];
      if (!allowed.includes(order.status)) return false;
      if (condition.previewCount !== undefined && order.previews.length !== condition.previewCount) {
        return false;
      }
      if (
        condition.lastPreviewResponse &&
        order.previews[lastPreviewIndex(condition)]?.response !== condition.lastPreviewResponse
      ) {
        return false;
      }

      const now = new Date().toISOString();
      if (change.status) order.status = change.status;
      if (change.answerLastPreview) {
        const preview = order.previews[lastPreviewIndex(condition)]!;
        preview.response = change.answerLastPreview.response;
        if (change.answerLastPreview.comment !== undefined) {
          preview.comment = change.answerLastPreview.comment;
        }
      }
      if (change.addPreview) {
        order.previews.push({ ...change.addPreview, response: "pending", comment: "", createdAt: now });
      }
      order.updatedAt = now;
      return true;
    },
  };
}
