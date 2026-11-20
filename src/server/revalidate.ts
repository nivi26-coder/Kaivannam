import "server-only";
import { revalidatePath } from "next/cache";

// After a change, re-render the pages that show it. Called from Server
// Actions (not services) because it's a Next.js concern, not a business rule.

/** An order changed: its tracking page and the artist dashboard. */
export function revalidateOrder(orderId: string) {
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
}

/** Something shown across the whole site changed, like an artist pausing orders. */
export function revalidateEverything() {
  revalidatePath("/", "layout");
}
