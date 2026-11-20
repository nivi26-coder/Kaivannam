import type { OrderWithDetails } from "@/domain/types";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { formatDate } from "@/lib/dates";
import { formatINR } from "@/lib/format";

export function CompletedOrders({ orders }: { orders: OrderWithDetails[] }) {
  if (orders.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold">Completed</h2>
      <ul className="divide-y rounded-xl border bg-card">
        {orders.map((order) => (
          <li key={order._id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{order.productSnapshot.title}</p>
              <p className="text-muted-foreground">
                {order.buyerName} · {formatDate(order.deliverBy)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatINR(order.totalPrice)}</p>
              <OrderStatusBadge status={order.status} audience="artist" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
