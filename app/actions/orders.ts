"use server";

// Server Actions for the order lifecycle.
//
// DEMO NOTE: there's no login yet, so these actions can't check *who* is
// calling. Server Actions are public HTTP endpoints, so in the MVP every
// action here must first verify the caller is the order's buyer or artist.
//
// Every status change goes through store.updateOrderIf(id, condition, change):
// the change only applies if the order is still in the expected state, so a
// double-click, two open tabs or a hand-crafted request can't skip steps or
// apply the same change twice.

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateInputs, type FieldErrors } from "@/lib/customFields";
import { addDays, earliestDeliveryYmd, formatDate, isValidYmd, todayIST, ymdToDate } from "@/lib/dates";
import { ARTIST_ADVANCE, CAN_SEND_PREVIEW, isOrderStatus } from "@/lib/orderStatus";
import { calculatePrice } from "@/lib/pricing";
import { getStore } from "@/lib/store";
import type { CustomInputs } from "@/lib/types";
import { isValidIndianMobile, normalizePhone } from "@/lib/validation";

/** How far ahead buyers can book. */
const MAX_DAYS_AHEAD = 180;

function revalidateOrder(orderId: string) {
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
}

// ------------------------------------------------------------ createOrder

export type CreateOrderState = {
  message?: string;
  errors?: FieldErrors;
};

export async function createOrder(
  _prevState: CreateOrderState,
  formData: FormData,
): Promise<CreateOrderState> {
  const productId = String(formData.get("productId") ?? "");
  if (!isValidObjectId(productId)) return { message: "This gift could not be found." };

  const store = getStore();
  const product = await store.findProduct(productId);
  if (!product) return { message: "This gift could not be found." };

  const { artist } = product;
  if (!artist.isAcceptingOrders) {
    return { message: `${artist.name} has paused new orders for now. Please check back soon.` };
  }

  // Read only the fields this product defines. Anything else in the request
  // (say, a "totalPrice" someone added with dev tools) is simply ignored.
  const inputs: CustomInputs = {};
  for (const field of product.customFields) {
    inputs[field.key] = String(formData.get(`field:${field.key}`) ?? "").trim();
  }

  // Validate on the server even though the form also checks: the browser
  // can be bypassed, the server can't.
  const errors = validateInputs(product.customFields, inputs);

  const buyerName = String(formData.get("buyerName") ?? "").trim();
  if (buyerName.length < 2) errors.buyerName = "Please enter your name.";
  else if (buyerName.length > 80) errors.buyerName = "Please use a shorter name.";

  const buyerPhone = normalizePhone(String(formData.get("buyerPhone") ?? ""));
  if (!isValidIndianMobile(buyerPhone)) errors.buyerPhone = "Enter a 10-digit mobile number.";

  const deliverBy = String(formData.get("deliverBy") ?? "");
  const earliest = earliestDeliveryYmd(artist.makingTimeDays);
  if (!isValidYmd(deliverBy)) {
    errors.deliverBy = "Choose a delivery date.";
  } else if (deliverBy < earliest) {
    errors.deliverBy = `The earliest ${artist.name} can deliver is ${formatDate(earliest)}.`;
  } else if (deliverBy > addDays(todayIST(), MAX_DAYS_AHEAD)) {
    errors.deliverBy = "Please choose a date within the next 6 months.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, message: "Please check the highlighted fields." };
  }

  // The server decides the price, from the product as stored in the database.
  const totalPrice = calculatePrice(product, inputs);

  const orderId = await store.insertOrder({
    buyerName,
    buyerPhone,
    artistId: artist._id,
    productId: product._id,
    productSnapshot: {
      title: product.title,
      basePrice: product.basePrice,
      imageUrl: product.images[0] ?? "",
      maxRevisions: product.maxRevisions,
    },
    // Drop empty optional fields so the order only shows what was filled in.
    inputs: Object.fromEntries(Object.entries(inputs).filter(([, value]) => value)),
    totalPrice,
    deliverBy: ymdToDate(deliverBy).toISOString(),
  });

  revalidatePath("/dashboard");
  // redirect() works by throwing, so it must stay outside any try/catch.
  redirect(`/orders/${orderId}`);
}

// ------------------------------------------------------------ buyer steps

/**
 * Demo stand-in for Razorpay checkout. In the MVP this happens in a payment
 * webhook after Razorpay confirms the money was captured (and held via Route).
 */
export async function payOrderDemo(orderId: string) {
  if (!isValidObjectId(orderId)) return;
  await getStore().updateOrderIf(orderId, { status: "PLACED" }, { status: "PAID" });
  revalidateOrder(orderId);
}

export async function approvePreview(orderId: string) {
  if (!isValidObjectId(orderId)) return;
  const store = getStore();
  const order = await store.findOrder(orderId);
  if (!order || order.status !== "PREVIEW_SENT" || order.previews.length === 0) return;

  await store.updateOrderIf(
    orderId,
    { status: "PREVIEW_SENT", previewCount: order.previews.length, lastPreviewResponse: "pending" },
    { status: "APPROVED", answerLastPreview: { response: "approved" } },
  );
  revalidateOrder(orderId);
}

export type RequestChangesState = { error?: string };

export async function requestChanges(
  orderId: string,
  _prevState: RequestChangesState,
  formData: FormData,
): Promise<RequestChangesState> {
  if (!isValidObjectId(orderId)) return { error: "Order not found." };

  const comment = String(formData.get("comment") ?? "").trim();
  if (comment.length < 5) return { error: "Tell the artist what to change — a few words is enough." };
  if (comment.length > 500) return { error: "Please keep your note under 500 characters." };

  const store = getStore();
  const order = await store.findOrder(orderId);
  if (!order || order.status !== "PREVIEW_SENT" || order.previews.length === 0) {
    return { error: "This preview can't be changed any more. Refresh to see the latest." };
  }

  // The revision limit protects artists from endless change requests.
  const used = order.previews.filter((p) => p.response === "changes_requested").length;
  if (used >= order.productSnapshot.maxRevisions) {
    return {
      error: `You've used all ${order.productSnapshot.maxRevisions} revisions included with this gift. Please approve the preview or contact the artist.`,
    };
  }

  const applied = await store.updateOrderIf(
    orderId,
    { status: "PREVIEW_SENT", previewCount: order.previews.length, lastPreviewResponse: "pending" },
    { status: "REVISION_REQUESTED", answerLastPreview: { response: "changes_requested", comment } },
  );
  if (!applied) {
    return { error: "This preview was already answered. Refresh to see the latest." };
  }

  revalidateOrder(orderId);
  return {};
}

// ----------------------------------------------------------- artist steps

/**
 * Demo: real image uploads arrive in the MVP. For now the artist "sends" one
 * of the product's own photos as a placeholder mockup.
 */
export async function sendPreview(orderId: string) {
  if (!isValidObjectId(orderId)) return;
  const store = getStore();
  const order = await store.findOrder(orderId);
  if (!order || !CAN_SEND_PREVIEW.includes(order.status)) return;

  const product = await store.findProduct(order.productId);
  const images = product?.images.length ? product.images : [order.productSnapshot.imageUrl];
  const round = order.previews.length + 1;

  await store.updateOrderIf(
    // The preview count makes a double-click harmless: the second call no longer matches.
    orderId,
    { status: order.status, previewCount: order.previews.length },
    { status: "PREVIEW_SENT", addPreview: { imageUrl: images[(round - 1) % images.length]!, round } },
  );
  revalidateOrder(orderId);
}

/** Moves an approved order along: APPROVED -> IN_PRODUCTION -> SHIPPED -> DELIVERED. */
export async function advanceOrder(orderId: string, fromStatus: string) {
  if (!isValidObjectId(orderId) || !isOrderStatus(fromStatus)) return;
  const step = ARTIST_ADVANCE[fromStatus];
  if (!step) return;

  await getStore().updateOrderIf(orderId, { status: fromStatus }, { status: step.next });
  revalidateOrder(orderId);
}
