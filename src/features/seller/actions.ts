"use server";

// Creator (seller) actions from the dashboard. Thin wrappers over services.
//
// DEMO NOTE: no login yet. In the MVP, these pass the signed-in creator to
// the services, which check they own the order.

import { revalidateEverything, revalidateOrder } from "@/server/revalidate";
import { setAcceptingOrders } from "@/server/services/creators";
import { advanceOrder, sendPreview } from "@/server/services/orders";

export async function sendPreviewAction(orderId: string) {
  await sendPreview(orderId);
  revalidateOrder(orderId);
}

export async function advanceOrderAction(orderId: string, fromStatus: string) {
  await advanceOrder(orderId, fromStatus);
  revalidateOrder(orderId);
}

export async function setAcceptingOrdersAction(creatorId: string, accepting: boolean) {
  await setAcceptingOrders(creatorId, accepting);
  // The paused state shows on the home, artist, product and dashboard pages.
  revalidateEverything();
}
