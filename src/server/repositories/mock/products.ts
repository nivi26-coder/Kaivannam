import type { ProductWithArtist } from "@/domain/types";
import type { ProductRepository } from "../types";
import { byCreatedAt, copy, withArtist, type MockDatabase } from "./database";

export function createMockProductRepository(db: MockDatabase): ProductRepository {
  return {
    async list({ occasion, limit }) {
      return db.products
        .filter((p) => !occasion || p.occasionTags.includes(occasion))
        .sort(byCreatedAt)
        .slice(0, limit)
        .map((p) => withArtist(db, p))
        .filter((product): product is ProductWithArtist => product !== null);
    },

    async listByArtist(artistId) {
      return copy(db.products.filter((p) => p.artistId === artistId).sort(byCreatedAt));
    },

    async findById(id) {
      const product = db.products.find((p) => p._id === id);
      return product ? withArtist(db, product) : null;
    },
  };
}
