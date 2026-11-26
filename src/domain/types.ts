// The shapes the whole app works with: pages, components, services and
// repositories all speak in these types.
//
// They are plain data (ids and dates are strings, money is integer paise) so
// they can be passed from Server to Client Components and stored anywhere.
// Database documents are converted into these shapes by the repositories.

import type { Paise } from "./money";
import type { OccasionSlug } from "./occasions";
import type { OrderStatus } from "./order-status";
import type { PriceLine } from "./pricing";
import type { OptionGroup, Selections } from "./product-options";

// ------------------------------------------------------------ creators

export interface Creator {
  _id: string;
  /** Storefront handle: kaivannam.in/<handle> (see creator-rules.ts). */
  handle: string;
  name: string;
  bio: string;
  city: string;
  state: string;
  avatarUrl: string;
  categories: string[];
  /** The "pause" toggle: creators switch this off during busy seasons. */
  isAcceptingOrders: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/** The slice of a creator shown next to a product. */
export type CreatorSummary = Pick<
  Creator,
  "_id" | "handle" | "name" | "city" | "avatarUrl" | "isVerified" | "isAcceptingOrders"
>;

// ------------------------------------------------------------ products

export interface Product {
  _id: string;
  creatorId: string;
  /** URL part, unique per creator: kaivannam.in/<handle>/<slug>. */
  slug: string;
  title: string;
  description: string;
  images: string[];
  occasionTags: OccasionSlug[];
  basePricePaise: Paise;
  /** Days to make the gift before any option adds time. */
  baseProductionDays: number;
  optionGroups: OptionGroup[];
  /** How many times the buyer may ask for changes to the mockup. */
  maxRevisions: number;
  /** Paid design mockup fee, or null when the product has none. */
  mockupFeePaise: Paise | null;
  /** Share of the item total paid upfront for materials (20–60%). */
  advancePercent: number;
  /** Packed weight and size, for courier rates and labels. */
  weightGrams: number;
  packageCm: { length: number; width: number; height: number };
  /** Hidden products work by direct link but aren't shown on the storefront. */
  isListed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithCreator extends Product {
  creator: CreatorSummary;
}

// -------------------------------------------------------------- orders

export type PreviewResponse = "pending" | "approved" | "changes_requested";

export interface Preview {
  imageUrl: string;
  round: number;
  response: PreviewResponse;
  comment: string;
  createdAt: string;
}

/** A copy of the product taken when the order is placed. */
export interface ProductSnapshot {
  title: string;
  basePricePaise: Paise;
  baseProductionDays: number;
  imageUrl: string;
  maxRevisions: number;
}

export interface Order {
  _id: string;
  buyerName: string;
  buyerPhone: string;
  creatorId: string;
  productId: string;
  productSnapshot: ProductSnapshot;
  /** The buyer's choices, keyed by option group. */
  selections: Selections;
  /** Price and extra days of each chosen option, as they were when ordered. */
  priceLines: PriceLine[];
  /** Calculated on the server with quoteItem(). */
  itemTotalPaise: Paise;
  productionDays: number;
  /** ISO dates (midnight IST): ready to ship, and expected arrival. */
  dispatchBy: string;
  estimatedDelivery: string;
  status: OrderStatus;
  previews: Preview[];
  createdAt: string;
  updatedAt: string;
}

/** An order plus what's needed to display it (creator name, option labels). */
export interface OrderWithDetails extends Order {
  creator: Pick<Creator, "_id" | "name" | "city"> | null;
  /** From the live product; null if the product was deleted. */
  optionGroups: OptionGroup[] | null;
}
