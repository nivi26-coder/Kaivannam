// The order lifecycle, in one place so the model, server actions and UI agree.
//
// PLACED -> PAID (held) -> PREVIEW_SENT -> APPROVED -> IN_PRODUCTION
//        -> SHIPPED -> DELIVERED -> PAYOUT_RELEASED (later)
// PREVIEW_SENT -> REVISION_REQUESTED -> PREVIEW_SENT
// Early stages -> CANCELLED (refund)

export const ORDER_STATUSES = [
  "PLACED",
  "PAID",
  "PREVIEW_SENT",
  "REVISION_REQUESTED",
  "APPROVED",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "PAYOUT_RELEASED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** What the buyer sees. */
export const BUYER_STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: "Awaiting payment",
  PAID: "Paid — held safely",
  PREVIEW_SENT: "Preview ready",
  REVISION_REQUESTED: "Changes requested",
  APPROVED: "Preview approved",
  IN_PRODUCTION: "Being made",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  PAYOUT_RELEASED: "Completed",
  CANCELLED: "Cancelled",
};

/** What the artist sees: phrased as what they need to do next. */
export const ARTIST_STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: "Waiting for payment",
  PAID: "Send a preview",
  PREVIEW_SENT: "Waiting for approval",
  REVISION_REQUESTED: "Revise preview",
  APPROVED: "Start making",
  IN_PRODUCTION: "Being made",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  PAYOUT_RELEASED: "Paid out",
  CANCELLED: "Cancelled",
};

/** Timeline steps shown on the order tracking page. */
export const TIMELINE_STEPS = [
  "Placed",
  "Paid (held)",
  "Preview",
  "Approved",
  "Being made",
  "Shipped",
  "Delivered",
] as const;

export const STATUS_STEP_INDEX: Record<OrderStatus, number> = {
  PLACED: 0,
  PAID: 1,
  PREVIEW_SENT: 2,
  REVISION_REQUESTED: 2,
  APPROVED: 3,
  IN_PRODUCTION: 4,
  SHIPPED: 5,
  DELIVERED: 6,
  PAYOUT_RELEASED: 6,
  CANCELLED: -1,
};

/** Statuses from which the artist can send a (new) preview. */
export const CAN_SEND_PREVIEW: OrderStatus[] = ["PAID", "REVISION_REQUESTED"];

/** Simple forward moves the artist makes after the buyer approves. */
export const ARTIST_ADVANCE: Partial<Record<OrderStatus, { next: OrderStatus; action: string }>> = {
  APPROVED: { next: "IN_PRODUCTION", action: "Start making" },
  IN_PRODUCTION: { next: "SHIPPED", action: "Mark as shipped" },
  SHIPPED: { next: "DELIVERED", action: "Mark as delivered" },
};

/** Orders that still need the artist's attention. */
export const ACTIVE_STATUSES: OrderStatus[] = [
  "PLACED",
  "PAID",
  "PREVIEW_SENT",
  "REVISION_REQUESTED",
  "APPROVED",
  "IN_PRODUCTION",
  "SHIPPED",
];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}
