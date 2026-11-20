"use server";

// Artist (seller) actions from the dashboard. Thin wrappers over services.
//
// DEMO NOTE: no login yet. In the MVP, these pass the signed-in artist to
// the services, which check they own the order.

import { revalidateEverything, revalidateOrder } from "@/server/revalidate";
import { setAcceptingOrders } from "@/server/services/artists";
import { advanceOrder, sendPreview } from "@/server/services/orders";

export async function sendPreviewAction(orderId: string) {
  await sendPreview(orderId);
  revalidateOrder(orderId);
}

export async function advanceOrderAction(orderId: string, fromStatus: string) {
  await advanceOrder(orderId, fromStatus);
  revalidateOrder(orderId);
}

export async function setAcceptingOrdersAction(artistId: string, accepting: boolean) {
  await setAcceptingOrders(artistId, accepting);
  // The paused state shows on the home, artist, product and dashboard pages.
  revalidateEverything();
}
