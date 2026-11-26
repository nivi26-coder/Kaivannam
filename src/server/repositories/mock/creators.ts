import type { Creator } from "@/domain/types";
import type { CreatorRepository } from "../types";
import { byCreatedAt, copy, type MockDatabase } from "./database";

export function createMockCreatorRepository(db: MockDatabase): CreatorRepository {
  return {
    async listFeatured(limit) {
      const rank = (c: Creator) => Number(c.isVerified) * 2 + Number(c.isAcceptingOrders);
      return copy(
        [...db.creators].sort((a, b) => rank(b) - rank(a) || byCreatedAt(a, b)).slice(0, limit),
      );
    },

    async list() {
      return copy([...db.creators].sort((a, b) => a.name.localeCompare(b.name)));
    },

    async findById(id) {
      const creator = db.creators.find((c) => c._id === id);
      return creator ? copy(creator) : null;
    },

    async setAcceptingOrders(id, accepting) {
      const creator = db.creators.find((c) => c._id === id);
      if (creator) {
        creator.isAcceptingOrders = accepting;
        creator.updatedAt = new Date().toISOString();
      }
    },
  };
}
