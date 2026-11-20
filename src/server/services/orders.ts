// Order use cases: everything that can happen to an order, with its rules.
//
// Services hold the business logic and nothing else:
// - no FormData, revalidatePath or redirect (that's the Server Actions' job,
//   in src/features/*/actions.ts);
// - storage only through repositories, passed in as `repos`. The app uses
//   the default; tests pass in-memory repositories.
// That's what lets a future Razorpay webhook call payOrder() exactly like
// the demo Pay button does.
//
// DEMO NOTE: there's no login yet, so nothing here checks *who* is calling.
// In the MVP, each use case takes the signed-in user and checks they are the
// order's buyer or artist.
//
// Every status change goes through orders.updateIf(id, condition, change):
// it only applies if the order is still in the expected state, so a
// double-click, two open tabs or a hand-crafted request can't skip steps or
// apply a change twice.

import "server-only";
import { isValidObjectId } from "mongoose";
import { validateBuyerDetails } from "@/domain/buyer";
import { validateInputs } from "@/domain/custom-fields";
import { deliveryWindow, validateDeliverBy } from "@/domain/delivery";
import { ARTIST_ADVANCE, CAN_SEND_PREVIEW, isOrderStatus } from "@/domain/order-status";
import { calculatePrice } from "@/domain/pricing";
import type { CustomInputs } from "@/domain/types";
import { ymdToDate } from "@/lib/dates";
import { getRepositories, type Repositories } from "@/server/repositories";
import { fail, ok, type Result } from "./result";

const ORDER_NOT_FOUND = "Order not found.";
const STALE = "This order has changed. Refresh to see the latest.";

// ------------------------------------------------------------ placeOrder

export interface PlaceOrderInput {
  productId: string;
  buyerName: string;
  buyerPhone: string;
  /** "YYYY-MM-DD" */
  deliverBy: string;
  /** Raw customization values from the form, keyed by field key. */
  inputs: CustomInputs;
}

export async function placeOrder(
  input: PlaceOrderInput,
  repos: Repositories = getRepositories(),
): Promise<Result<{ orderId: string }>> {
  if (!isValidObjectId(input.productId)) return fail("This gift could not be found.");

  const product = await repos.products.findById(input.productId);
  if (!product) return fail("This gift could not be found.");

  const { artist } = product;
  if (!artist.isAcceptingOrders) {
    return fail(`${artist.name} has paused new orders for now. Please check back soon.`);
  }

  // Keep only the fields this product defines. Anything else in the request
  // (say, a "totalPrice" someone added with dev tools) is simply ignored.
  const inputs: CustomInputs = {};
  for (const field of product.customFields) {
    inputs[field.key] = (input.inputs[field.key] ?? "").trim();
  }

  // The same checks the form runs, repeated here because the browser can be
  // bypassed and the server can't.
  const errors = validateInputs(product.customFields, inputs);
  const buyer = validateBuyerDetails(input);
  Object.assign(errors, buyer.errors);
  const deliverByError = validateDeliverBy(
    input.deliverBy,
    deliveryWindow(artist.makingTimeDays),
    artist.name,
  );
  if (deliverByError) errors.deliverBy = deliverByError;

  if (Object.keys(errors).length > 0) return fail("Please check the highlighted fields.", errors);

  // The server decides the price, from the product as stored.
  const totalPrice = calculatePrice(product, inputs);

  const orderId = await repos.orders.create({
    ...buyer.value,
    artistId: artist._id,
    productId: product._id,
    // A copy of the product as it is now: later edits won't change this order.
    productSnapshot: {
      title: product.title,
      basePrice: product.basePrice,
      imageUrl: product.images[0] ?? "",
      maxRevisions: product.maxRevisions,
    },
    // Drop empty optional fields so the order only shows what was filled in.
    inputs: Object.fromEntries(Object.entries(inputs).filter(([, value]) => value)),
    totalPrice,
    deliverBy: ymdToDate(input.deliverBy).toISOString(),
  });

  return ok({ orderId });
}

// ----------------------------------------------------------- buyer steps

/**
 * Demo stand-in for Razorpay checkout. In the MVP a payment webhook calls
 * this after Razorpay confirms the money was captured (and held via Route).
 */
export async function payOrder(orderId: string, repos: Repositories = getRepositories()): Promise<Result> {
  if (!isValidObjectId(orderId)) return fail(ORDER_NOT_FOUND);
  const applied = await repos.orders.updateIf(orderId, { status: "PLACED" }, { status: "PAID" });
  return applied ? ok() : fail(STALE);
}

export async function approvePreview(
  orderId: string,
  repos: Repositories = getRepositories(),
): Promise<Result> {
  if (!isValidObjectId(orderId)) return fail(ORDER_NOT_FOUND);
  const order = await repos.orders.findById(orderId);
  if (!order) return fail(ORDER_NOT_FOUND);
  if (order.status !== "PREVIEW_SENT" || order.previews.length === 0) return fail(STALE);

  const applied = await repos.orders.updateIf(
    orderId,
    { status: "PREVIEW_SENT", previewCount: order.previews.length, lastPreviewResponse: "pending" },
    { status: "APPROVED", answerLastPreview: { response: "approved" } },
  );
  return applied ? ok() : fail(STALE);
}

export async function requestChanges(
  orderId: string,
  rawComment: string,
  repos: Repositories = getRepositories(),
): Promise<Result> {
  if (!isValidObjectId(orderId)) return fail(ORDER_NOT_FOUND);

  const comment = rawComment.trim();
  if (comment.length < 5) return fail("Tell the artist what to change — a few words is enough.");
  if (comment.length > 500) return fail("Please keep your note under 500 characters.");

  const order = await repos.orders.findById(orderId);
  if (!order) return fail(ORDER_NOT_FOUND);
  if (order.status !== "PREVIEW_SENT" || order.previews.length === 0) {
    return fail("This preview can't be changed any more. Refresh to see the latest.");
  }

  // The revision limit (from the order's snapshot) protects artists from
  // endless change requests.
  const { maxRevisions } = order.productSnapshot;
  const used = order.previews.filter((p) => p.response === "changes_requested").length;
  if (used >= maxRevisions) {
    return fail(
      `You've used all ${maxRevisions} revisions included with this gift. Please approve the preview or contact the artist.`,
    );
  }

  const applied = await repos.orders.updateIf(
    orderId,
    { status: "PREVIEW_SENT", previewCount: order.previews.length, lastPreviewResponse: "pending" },
    { status: "REVISION_REQUESTED", answerLastPreview: { response: "changes_requested", comment } },
  );
  return applied ? ok() : fail("This preview was already answered. Refresh to see the latest.");
}

// ---------------------------------------------------------- artist steps

/**
 * Demo: real image uploads arrive in the MVP. For now the artist "sends" one
 * of the product's own photos as a placeholder mockup.
 */
export async function sendPreview(orderId: string, repos: Repositories = getRepositories()): Promise<Result> {
  if (!isValidObjectId(orderId)) return fail(ORDER_NOT_FOUND);
  const order = await repos.orders.findById(orderId);
  if (!order) return fail(ORDER_NOT_FOUND);
  if (!CAN_SEND_PREVIEW.includes(order.status)) return fail(STALE);

  const product = await repos.products.findById(order.productId);
  const images = product?.images.length ? product.images : [order.productSnapshot.imageUrl];
  const round = order.previews.length + 1;

  const applied = await repos.orders.updateIf(
    // The preview count makes a double-click harmless: the second call no longer matches.
    orderId,
    { status: order.status, previewCount: order.previews.length },
    { status: "PREVIEW_SENT", addPreview: { imageUrl: images[(round - 1) % images.length]!, round } },
  );
  return applied ? ok() : fail(STALE);
}

/** Moves an approved order along: APPROVED -> IN_PRODUCTION -> SHIPPED -> DELIVERED. */
export async function advanceOrder(
  orderId: string,
  fromStatus: string,
  repos: Repositories = getRepositories(),
): Promise<Result> {
  if (!isValidObjectId(orderId)) return fail(ORDER_NOT_FOUND);
  if (!isOrderStatus(fromStatus)) return fail(STALE);
  const step = ARTIST_ADVANCE[fromStatus];
  if (!step) return fail(STALE);

  const applied = await repos.orders.updateIf(orderId, { status: fromStatus }, { status: step.next });
  return applied ? ok() : fail(STALE);
}
