// The shapes the whole app works with: pages, components, services and
// repositories all speak in these types.
//
// They are plain data (ids and dates are strings) so they can be passed from
// Server to Client Components and stored anywhere. Database documents are
// converted into these shapes by the repositories in src/server.

import type { OccasionSlug } from "./occasions";
import type { OrderStatus } from "./order-status";

// ------------------------------------------------------- customization

export type CustomFieldType = "text" | "image" | "select";

export interface CustomFieldOption {
  value: string;
  label: string;
  /** Added to the base price when chosen. Whole rupees, can be 0. */
  priceModifier: number;
}

export interface CustomField {
  key: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options: CustomFieldOption[];
}

/** Values the buyer entered, keyed by CustomField.key. */
export type CustomInputs = Record<string, string>;

// ------------------------------------------------------------- artists

export interface Artist {
  _id: string;
  name: string;
  bio: string;
  city: string;
  state: string;
  avatarUrl: string;
  categories: string[];
  /** Days needed to make an order, before shipping. */
  makingTimeDays: number;
  /** The "pause" toggle: artists switch this off during busy seasons. */
  isAcceptingOrders: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/** The slice of an artist shown next to a product. */
export type ArtistSummary = Pick<
  Artist,
  "_id" | "name" | "city" | "avatarUrl" | "isVerified" | "isAcceptingOrders" | "makingTimeDays"
>;

// ------------------------------------------------------------ products

export interface Product {
  _id: string;
  artistId: string;
  title: string;
  description: string;
  /** Whole rupees. */
  basePrice: number;
  images: string[];
  occasionTags: OccasionSlug[];
  /** How many times the buyer may ask for changes to the preview. */
  maxRevisions: number;
  customFields: CustomField[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithArtist extends Product {
  artist: ArtistSummary;
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
  basePrice: number;
  imageUrl: string;
  maxRevisions: number;
}

export interface Order {
  _id: string;
  buyerName: string;
  buyerPhone: string;
  artistId: string;
  productId: string;
  productSnapshot: ProductSnapshot;
  inputs: CustomInputs;
  /** Calculated on the server with calculatePrice(). Whole rupees. */
  totalPrice: number;
  deliverBy: string;
  status: OrderStatus;
  previews: Preview[];
  createdAt: string;
  updatedAt: string;
}

/** An order plus what's needed to display it (artist name, field labels). */
export interface OrderWithDetails extends Order {
  artist: Pick<Artist, "_id" | "name" | "city"> | null;
  /** From the live product; null if the product was deleted. */
  customFields: CustomField[] | null;
}
