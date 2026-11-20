import type { Artist } from "@/domain/types";
import type { ArtistRepository } from "../types";
import { byCreatedAt, copy, type MockDatabase } from "./database";

export function createMockArtistRepository(db: MockDatabase): ArtistRepository {
  return {
    async listFeatured(limit) {
      const rank = (a: Artist) => Number(a.isVerified) * 2 + Number(a.isAcceptingOrders);
      return copy(
        [...db.artists].sort((a, b) => rank(b) - rank(a) || byCreatedAt(a, b)).slice(0, limit),
      );
    },

    async list() {
      return copy([...db.artists].sort((a, b) => a.name.localeCompare(b.name)));
    },

    async findById(id) {
      const artist = db.artists.find((a) => a._id === id);
      return artist ? copy(artist) : null;
    },

    async setAcceptingOrders(id, accepting) {
      const artist = db.artists.find((a) => a._id === id);
      if (artist) {
        artist.isAcceptingOrders = accepting;
        artist.updatedAt = new Date().toISOString();
      }
    },
  };
}
