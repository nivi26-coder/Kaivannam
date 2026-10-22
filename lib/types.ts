// Plain TypeScript shapes shared by server and client code.
//
// Mongoose documents can't be passed to Client Components (ObjectIds and
// Dates aren't serializable), so pages work with these "DTO" shapes instead:
// ids are strings and dates are ISO strings, exactly what
// JSON.parse(JSON.stringify(doc)) produces.

import type { OccasionSlug } from "./occasions";
import type { OrderStatus } from "./orderStatus";

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

export interface ArtistDTO {
  _id: string;
  name: string;
  bio: string;
  city: string;
  state: string;
  avatarUrl: string;
  categories: string[];
  makingTimeDays: number;
  isAcceptingOrders: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/** The slice of an artist shown next to a product. */
export type ArtistSummary = Pick<
  ArtistDTO,
  "_id" | "name" | "city" | "avatarUrl" | "isVerified" | "isAcceptingOrders" | "makingTimeDays"
>;

export interface ProductDTO {
  _id: string;
  artistId: string;
  title: string;
  description: string;
  basePrice: number;
  images: string[];
  occasionTags: OccasionSlug[];
  maxRevisions: number;
  customFields: CustomField[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithArtist extends ProductDTO {
  artist: ArtistSummary;
}

export type PreviewResponse = "pending" | "approved" | "changes_requested";

export interface PreviewDTO {
  imageUrl: string;
  round: number;
  response: PreviewResponse;
  comment: string;
  createdAt: string;
}

export interface OrderDTO {
  _id: string;
  buyerName: string;
  buyerPhone: string;
  artistId: string;
  productId: string;
  productSnapshot: {
    title: string;
    basePrice: number;
    imageUrl: string;
    maxRevisions: number;
  };
  inputs: CustomInputs;
  totalPrice: number;
  deliverBy: string;
  status: OrderStatus;
  previews: PreviewDTO[];
  createdAt: string;
  updatedAt: string;
}

/** An order plus what's needed to display it (artist name, field labels). */
export interface OrderWithDetails extends OrderDTO {
  artist: Pick<ArtistDTO, "_id" | "name" | "city"> | null;
  /** From the live product; null if the product was deleted. */
  customFields: CustomField[] | null;
}
