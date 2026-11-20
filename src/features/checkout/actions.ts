"use server";

// Server Actions are the browser's door into the server. They stay thin:
// read the form, call a service, then refresh or redirect. The business rules
// live in src/server/services.

import { redirect } from "next/navigation";
import type { FieldErrors } from "@/domain/custom-fields";
import { getPrefixed, getString } from "@/lib/form-data";
import { revalidateOrder } from "@/server/revalidate";
import { placeOrder } from "@/server/services/orders";

export type PlaceOrderState = {
  message?: string;
  errors?: FieldErrors;
};

export async function placeOrderAction(
  _prevState: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  const result = await placeOrder({
    productId: getString(formData, "productId"),
    buyerName: getString(formData, "buyerName"),
    buyerPhone: getString(formData, "buyerPhone"),
    deliverBy: getString(formData, "deliverBy"),
    // Customization fields are named "field:<key>". The service keeps only
    // the keys the product defines. Note there is no price here.
    inputs: getPrefixed(formData, "field:"),
  });

  if (!result.ok) return { message: result.error, errors: result.fieldErrors };

  revalidateOrder(result.value.orderId);
  // redirect() works by throwing, so it must stay outside any try/catch.
  redirect(`/orders/${result.value.orderId}`);
}
