import type { ProductWithCreator } from "@/domain/types";
import type { ProductRepository } from "../types";
import { byCreatedAt, copy, withCreator, type MockDatabase } from "./database";

export function createMockProductRepository(db: MockDatabase): ProductRepository {
  return {
    async list({ occasion, limit }) {
      return db.products
        .filter((p) => p.isListed && (!occasion || p.occasionTags.includes(occasion)))
        .sort(byCreatedAt)
        .slice(0, limit)
        .map((p) => withCreator(db, p))
        .filter((product): product is ProductWithCreator => product !== null);
    },

    async listByCreator(creatorId) {
      return copy(db.products.filter((p) => p.creatorId === creatorId && p.isListed).sort(byCreatedAt));
    },

    async findById(id) {
      const product = db.products.find((p) => p._id === id);
      return product ? withCreator(db, product) : null;
    },
  };
}
