"use server";

// Buyer actions on an existing order. Thin wrappers over the order services.

import { getString } from "@/lib/form-data";
import { revalidateOrder } from "@/server/revalidate";
import { approvePreview, payOrder, requestChanges } from "@/server/services/orders";

/** Demo stand-in for Razorpay checkout. */
export async function payOrderAction(orderId: string) {
  await payOrder(orderId);
  revalidateOrder(orderId);
}

export async function approvePreviewAction(orderId: string) {
  await approvePreview(orderId);
  revalidateOrder(orderId);
}

export type RequestChangesState = { error?: string };

export async function requestChangesAction(
  orderId: string,
  _prevState: RequestChangesState,
  formData: FormData,
): Promise<RequestChangesState> {
  const result = await requestChanges(orderId, getString(formData, "comment"));
  if (!result.ok) return { error: result.error };
  revalidateOrder(orderId);
  return {};
}
