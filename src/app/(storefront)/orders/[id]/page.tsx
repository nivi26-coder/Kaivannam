import { notFound } from "next/navigation";
import { Bookmark } from "lucide-react";
import { OrderDetails } from "@/features/orders/components/OrderDetails";
import { OrderNextStep } from "@/features/orders/components/OrderNextStep";
import { OrderSummary } from "@/features/orders/components/OrderSummary";
import { OrderTimeline } from "@/features/orders/components/OrderTimeline";
import { PreviewHistory } from "@/features/orders/components/PreviewHistory";
import { getOrder } from "@/server/queries";

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <OrderSummary order={order} />
      <OrderNextStep order={order} />
      <PreviewHistory order={order} />

      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-4 font-heading text-lg font-semibold">Progress</h2>
        <OrderTimeline status={order.status} />
      </section>

      <OrderDetails order={order} />

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Bookmark className="size-4 shrink-0" aria-hidden />
        Bookmark this page — it&apos;s how you get back to your order in this demo (there are no
        logins yet).
      </p>
    </div>
  );
}
