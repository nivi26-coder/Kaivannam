// Store backed by in-memory demo data, for running without a database.
//
// - Data comes from lib/demoData.ts, the same data `npm run seed` writes to Atlas.
// - Changes (new orders, previews, pausing) live in server memory and are lost
//   when the server restarts.
// - The data is kept on `globalThis` so it survives hot reloads in `next dev`.
// - Works with `npm run dev` / `npm start` (one server process). On Vercel,
//   requests can land on different serverless instances that don't share
//   memory, so use Atlas there.

import "server-only";
import { Types } from "mongoose";
import { buildDemoData } from "../demoData";
import type {
  ArtistDTO,
  ArtistSummary,
  OrderDTO,
  OrderWithDetails,
  ProductDTO,
  ProductWithArtist,
} from "../types";
import { lastPreviewIndex, type Store } from "./types";

interface MockDb {
  artists: ArtistDTO[];
  products: ProductDTO[];
  orders: OrderDTO[];
}

const globalForMock = globalThis as typeof globalThis & { kaivannamMockDb?: MockDb };

// Built on first use (at request time), not at import, so dates are relative
// to when the server started serving.
function db(): MockDb {
  if (!globalForMock.kaivannamMockDb) {
    const { artists, products, orders } = buildDemoData();
    globalForMock.kaivannamMockDb = { artists, products, orders };
  }
  return globalForMock.kaivannamMockDb;
}

/** Hand out copies, so callers can't accidentally edit the "database". */
const copy = <T>(value: T): T => structuredClone(value);

const byCreatedAt = (a: { createdAt: string }, b: { createdAt: string }) =>
  a.createdAt.localeCompare(b.createdAt);

function summary(artist: ArtistDTO): ArtistSummary {
  const { _id, name, city, avatarUrl, isVerified, isAcceptingOrders, makingTimeDays } = artist;
  return { _id, name, city, avatarUrl, isVerified, isAcceptingOrders, makingTimeDays };
}

function withArtist(product: ProductDTO): ProductWithArtist | null {
  const artist = db().artists.find((a) => a._id === product.artistId);
  return artist ? copy({ ...product, artist: summary(artist) }) : null;
}

function withDetails(order: OrderDTO): OrderWithDetails {
  const artist = db().artists.find((a) => a._id === order.artistId);
  const product = db().products.find((p) => p._id === order.productId);
  return copy({
    ...order,
    artist: artist ? { _id: artist._id, name: artist.name, city: artist.city } : null,
    customFields: product?.customFields ?? null,
  });
}

export const mockStore: Store = {
  // ---------------------------------------------------------- artists

  async listFeaturedArtists(limit) {
    const rank = (a: ArtistDTO) => Number(a.isVerified) * 2 + Number(a.isAcceptingOrders);
    return copy(
      [...db().artists]
        .sort((a, b) => rank(b) - rank(a) || byCreatedAt(a, b))
        .slice(0, limit),
    );
  },

  async listArtists() {
    return copy([...db().artists].sort((a, b) => a.name.localeCompare(b.name)));
  },

  async findArtist(id) {
    const artist = db().artists.find((a) => a._id === id);
    return artist ? copy(artist) : null;
  },

  async countCompletedOrders(artistId) {
    return db().orders.filter(
      (o) => o.artistId === artistId && (o.status === "DELIVERED" || o.status === "PAYOUT_RELEASED"),
    ).length;
  },

  async setAcceptingOrders(artistId, accepting) {
    const artist = db().artists.find((a) => a._id === artistId);
    if (artist) {
      artist.isAcceptingOrders = accepting;
      artist.updatedAt = new Date().toISOString();
    }
  },

  // --------------------------------------------------------- products

  async listProducts({ occasion, limit }) {
    return db()
      .products.filter((p) => !occasion || p.occasionTags.includes(occasion))
      .sort(byCreatedAt)
      .slice(0, limit)
      .map(withArtist)
      .filter((product): product is ProductWithArtist => product !== null);
  },

  async listArtistProducts(artistId) {
    return copy(db().products.filter((p) => p.artistId === artistId).sort(byCreatedAt));
  },

  async findProduct(id) {
    const product = db().products.find((p) => p._id === id);
    return product ? withArtist(product) : null;
  },

  // ----------------------------------------------------------- orders

  async findOrder(id) {
    const order = db().orders.find((o) => o._id === id);
    return order ? withDetails(order) : null;
  },

  async listArtistOrders(artistId) {
    return db()
      .orders.filter((o) => o.artistId === artistId)
      .sort((a, b) => a.deliverBy.localeCompare(b.deliverBy))
      .map(withDetails);
  },

  async insertOrder(order) {
    const now = new Date().toISOString();
    const id = new Types.ObjectId().toString();
    db().orders.push({
      ...copy(order),
      _id: id,
      status: "PLACED",
      previews: [],
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },

  // Check-then-change with no `await` in between: Node runs this function to
  // completion before handling another request, so it's as safe as Mongo's
  // conditional update.
  async updateOrderIf(id, condition, change) {
    const order = db().orders.find((o) => o._id === id);
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
