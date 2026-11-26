import Image from "next/image";
import Link from "next/link";
import type { OrderWithDetails } from "@/domain/types";
import { formatDate } from "@/lib/dates";
import { formatINR, orderRef } from "@/lib/format";
import { OrderStatusBadge } from "./OrderStatusBadge";

/** Order reference, status, product photo, title, price and deadline. */
export function OrderSummary({ order }: { order: OrderWithDetails }) {
  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Order {orderRef(order._id)}</p>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="flex gap-4">
        {order.productSnapshot.imageUrl && (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
            <Image src={order.productSnapshot.imageUrl} alt="" fill sizes="80px" className="object-cover" />
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-xl leading-snug font-semibold">{order.productSnapshot.title}</h1>
          {order.creator && (
            <p className="text-sm text-muted-foreground">
              by{" "}
              <Link href={`/artists/${order.creator._id}`} className="underline underline-offset-2">
                {order.creator.name}
              </Link>
            </p>
          )}
          <p className="text-sm">
            <span className="font-semibold">{formatINR(order.itemTotalPaise)}</span>
            <span className="text-muted-foreground"> · arrives around {formatDate(order.estimatedDelivery)}</span>
          </p>
        </div>
      </div>
    </header>
  );
}
