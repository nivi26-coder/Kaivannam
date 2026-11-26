// Repositories: the only code that knows where data is stored.
//
// Each entity has a repository interface. There are two implementations:
// - mongo/: MongoDB Atlas via Mongoose (when MONGODB_URI is set);
// - mock/:  in-memory demo data (when it isn't, and in unit tests).
//
// Services and page queries use these interfaces only, so the storage can
// change without touching business logic or UI.

import type { OccasionSlug } from "@/domain/occasions";
import type { OrderStatus } from "@/domain/order-status";
import type {
  Creator,
  Order,
  OrderWithDetails,
  PreviewResponse,
  Product,
  ProductWithCreator,
} from "@/domain/types";

export interface CreatorRepository {
  /** Verified and accepting creators first. */
  listFeatured(limit: number): Promise<Creator[]>;
  /** All creators, by name. */
  list(): Promise<Creator[]>;
  /** Null for unknown ids, including ones that aren't valid ObjectIds. */
  findById(id: string): Promise<Creator | null>;
  setAcceptingOrders(id: string, accepting: boolean): Promise<void>;
}

export interface ProductRepository {
  list(options: { occasion?: OccasionSlug; limit: number }): Promise<ProductWithCreator[]>;
  listByCreator(creatorId: string): Promise<Product[]>;
  findById(id: string): Promise<ProductWithCreator | null>;
}

export interface OrderRepository {
  findById(id: string): Promise<OrderWithDetails | null>;
  /** Soonest dispatch deadline first. */
  listByCreator(creatorId: string): Promise<OrderWithDetails[]>;
  /** Orders delivered through the platform. */
  countCompletedByCreator(creatorId: string): Promise<number>;
  /** Creates a PLACED order and returns its id. */
  create(order: NewOrder): Promise<string>;
  /** Applies `change` only if the order matches `condition`. Returns whether it applied. */
  updateIf(id: string, condition: OrderCondition, change: OrderChange): Promise<boolean>;
}

export interface Repositories {
  creators: CreatorRepository;
  products: ProductRepository;
  orders: OrderRepository;
}

export type NewOrder = Pick<
  Order,
  | "buyerName"
  | "buyerPhone"
  | "creatorId"
  | "productId"
  | "productSnapshot"
  | "selections"
  | "priceLines"
  | "itemTotalPaise"
  | "productionDays"
  | "dispatchBy"
  | "estimatedDelivery"
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

/** Index of the latest preview, as fixed by the condition's previewCount. */
export function lastPreviewIndex(condition: OrderCondition): number {
  if (condition.previewCount === undefined || condition.previewCount < 1) {
    throw new Error("Updating the latest preview requires previewCount >= 1 in the condition.");
  }
  return condition.previewCount - 1;
}
