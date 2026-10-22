import { ARTIST_STATUS_LABEL, BUYER_STATUS_LABEL, type OrderStatus } from "@/lib/orderStatus";
import { cn } from "@/lib/utils";

const TONE: Record<OrderStatus, string> = {
  PLACED: "bg-muted text-muted-foreground",
  PAID: "bg-emerald-100 text-emerald-800",
  PREVIEW_SENT: "bg-sky-100 text-sky-800",
  REVISION_REQUESTED: "bg-orange-100 text-orange-800",
  APPROVED: "bg-accent text-accent-foreground",
  IN_PRODUCTION: "bg-accent text-accent-foreground",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  PAYOUT_RELEASED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function StatusBadge({
  status,
  audience = "buyer",
  className,
}: {
  status: OrderStatus;
  audience?: "buyer" | "artist";
  className?: string;
}) {
  const label = audience === "artist" ? ARTIST_STATUS_LABEL[status] : BUYER_STATUS_LABEL[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
