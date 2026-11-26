"use server";

// Server Actions are the browser's door into the server. They stay thin:
// read the form, call a service, then refresh or redirect. The business rules
// live in src/server/services.

import { redirect } from "next/navigation";
import type { FieldErrors } from "@/domain/errors";
import { getPrefixedValues, getString } from "@/lib/form-data";
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
    // Option answers are named "option:<group key>"; checkboxes repeat the
    // name. The service keeps only the groups the product defines. Note
    // there is no price here.
    selections: getPrefixedValues(formData, "option:"),
  });

  if (!result.ok) return { message: result.error, errors: result.fieldErrors };

  revalidateOrder(result.value.orderId);
  // redirect() works by throwing, so it must stay outside any try/catch.
  redirect(`/orders/${result.value.orderId}`);
}
