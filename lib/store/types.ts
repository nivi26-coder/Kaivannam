// The data operations the app needs, independent of where data lives.
//
// Two implementations:
// - mongo.ts: MongoDB Atlas via Mongoose (when MONGODB_URI is set);
// - mock.ts:  in-memory demo data (when it isn't, e.g. before Atlas is ready).
//
// Pages and Server Actions only talk to this interface, so switching between
// them needs no other code changes.

import type { OccasionSlug } from "../occasions";
import type { OrderStatus } from "../orderStatus";
import type {
  ArtistDTO,
  OrderDTO,
  OrderWithDetails,
  PreviewResponse,
  ProductDTO,
  ProductWithArtist,
} from "../types";

export type NewOrder = Pick<
  OrderDTO,
  | "buyerName"
  | "buyerPhone"
  | "artistId"
  | "productId"
  | "productSnapshot"
  | "inputs"
  | "totalPrice"
  | "deliverBy"
>;

/**
 * What the order must look like for an update to apply. If it doesn't match
 * (someone double-clicked, or another tab already changed it), nothing happens.
 */
export interface OrderCondition {
  status: OrderStatus | OrderStatus[];
  /** Exact number of previews the order must have. */
  previewCount?: number;
  /** Required response on the latest preview. Needs previewCount. */
  lastPreviewResponse?: PreviewResponse;
}

export interface OrderChange {
  status?: OrderStatus;
  /** Answer the latest preview. Needs previewCount in the condition. */
  answerLastPreview?: { response: PreviewResponse; comment?: string };
  addPreview?: { imageUrl: string; round: number };
}

export interface Store {
  // artists
  listFeaturedArtists(limit: number): Promise<ArtistDTO[]>;
  listArtists(): Promise<ArtistDTO[]>;
  findArtist(id: string): Promise<ArtistDTO | null>;
  countCompletedOrders(artistId: string): Promise<number>;
  setAcceptingOrders(artistId: string, accepting: boolean): Promise<void>;

  // products
  listProducts(options: { occasion?: OccasionSlug; limit: number }): Promise<ProductWithArtist[]>;
  listArtistProducts(artistId: string): Promise<ProductDTO[]>;
  findProduct(id: string): Promise<ProductWithArtist | null>;

  // orders
  findOrder(id: string): Promise<OrderWithDetails | null>;
  listArtistOrders(artistId: string): Promise<OrderWithDetails[]>;
  /** Creates a PLACED order and returns its id. */
  insertOrder(order: NewOrder): Promise<string>;
  /** Applies `change` only if the order matches `condition`. Returns whether it applied. */
  updateOrderIf(id: string, condition: OrderCondition, change: OrderChange): Promise<boolean>;
}

/** Index of the latest preview, as fixed by the condition's previewCount. */
export function lastPreviewIndex(condition: OrderCondition): number {
  if (condition.previewCount === undefined || condition.previewCount < 1) {
    throw new Error("Updating the latest preview requires previewCount >= 1 in the condition.");
  }
  return condition.previewCount - 1;
}
