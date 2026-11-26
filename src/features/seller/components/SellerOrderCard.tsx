import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { SubmitButton } from "@/components/common/SubmitButton";
import { ARTIST_ADVANCE, CAN_SEND_PREVIEW } from "@/domain/order-status";
import { describeDeadline, type DeadlineUrgency } from "@/domain/seller-dashboard";
import { describeSelections } from "@/domain/product-options";
import type { OrderWithDetails } from "@/domain/types";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { formatDate } from "@/lib/dates";
import { formatINR, orderRef } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { advanceOrderAction, sendPreviewAction } from "../actions";

/** An active order on the creator dashboard, with the next action to take. */
export function SellerOrderCard({ order, today }: { order: OrderWithDetails; today: string }) {
  const details = describeSelections(order.optionGroups, order.selections);
  const lastPreview = order.previews.at(-1);
  const advance = ARTIST_ADVANCE[order.status];

  return (
    <article className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium">{order.productSnapshot.title}</h3>
          <p className="text-sm text-muted-foreground">
            {orderRef(order._id)} · {formatINR(order.itemTotalPaise)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} audience="creator" />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Ship by {formatDate(order.dispatchBy)}</span>
        <DeadlineChip dispatchBy={order.dispatchBy} today={today} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-medium">{order.buyerName}</span>
        <a
          href={`https://wa.me/91${order.buyerPhone}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <MessageSquare className="size-3.5" aria-hidden />
          {formatPhone(order.buyerPhone)}
        </a>
      </div>

      {details.length > 0 && (
        <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 gap-y-1 rounded-lg bg-muted/60 p-3 text-sm">
          {details.map((item) => (
            <div key={item.label} className="contents">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="min-w-0 break-words">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {order.status === "REVISION_REQUESTED" && lastPreview?.comment && (
        <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-900">
          <span className="font-medium">Buyer&apos;s note on round {lastPreview.round}:</span>{" "}
          &ldquo;{lastPreview.comment}&rdquo;
        </p>
      )}

      {CAN_SEND_PREVIEW.includes(order.status) && (
        <form action={sendPreviewAction.bind(null, order._id)} className="space-y-1">
          <SubmitButton className="h-10 w-full" pendingText="Sending…">
            {order.status === "REVISION_REQUESTED" ? "Send revised preview" : "Send preview"}
          </SubmitButton>
          <p className="text-center text-xs text-muted-foreground">
            Demo: sends a placeholder image instead of an upload.
          </p>
        </form>
      )}

      {advance && (
        <form action={advanceOrderAction.bind(null, order._id, order.status)}>
          <SubmitButton className="h-10 w-full" pendingText="Updating…">
            {advance.action}
          </SubmitButton>
        </form>
      )}

      <Link href={`/orders/${order._id}`} className="block text-center text-xs text-muted-foreground hover:underline">
        See what the buyer sees
      </Link>
    </article>
  );
}

const URGENCY_TONE: Record<DeadlineUrgency, string> = {
  overdue: "bg-red-100 text-red-800",
  soon: "bg-amber-100 text-amber-900",
  normal: "bg-muted text-muted-foreground",
};

function DeadlineChip({ dispatchBy, today }: { dispatchBy: string; today: string }) {
  const { label, urgency } = describeDeadline(dispatchBy, today);
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", URGENCY_TONE[urgency])}>{label}</span>;
}
