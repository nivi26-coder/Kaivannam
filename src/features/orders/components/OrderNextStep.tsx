import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { SubmitButton } from "@/components/common/SubmitButton";
import type { OrderWithDetails } from "@/domain/types";
import { formatDate } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { approvePreviewAction, payOrderAction } from "../actions";
import { RequestChangesForm } from "./RequestChangesForm";

/** The one thing the buyer should know or do right now. */
export function OrderNextStep({ order }: { order: OrderWithDetails }) {
  const artistName = order.artist?.name ?? "The artist";

  switch (order.status) {
    case "PLACED":
      return (
        <section className="space-y-3 rounded-xl border-2 border-primary/30 bg-card p-4">
          <h2 className="font-heading text-lg font-semibold">Pay {formatINR(order.totalPrice)} to confirm</h2>
          <p className="flex gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-5 shrink-0 text-emerald-700" aria-hidden />
            Kaivannam holds your money safely. {artistName} is paid only after your gift is
            delivered.
          </p>
          <form action={payOrderAction.bind(null, order._id)}>
            <SubmitButton className="h-11 w-full text-base" pendingText="Processing…">
              Pay {formatINR(order.totalPrice)}
            </SubmitButton>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            Demo: no money is charged. Real payments (Razorpay) come later.
          </p>
        </section>
      );

    case "PAID":
      return (
        <Callout tone="success" title="Payment received and held safely">
          {artistName} is working on a preview of your gift. You&apos;ll see it here to approve before
          anything is made.
        </Callout>
      );

    case "PREVIEW_SENT": {
      const latest = order.previews.at(-1)!;
      const used = order.previews.filter((p) => p.response === "changes_requested").length;
      return (
        <section className="space-y-4 rounded-xl border-2 border-sky-200 bg-card p-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">Your preview is ready</h2>
            <p className="text-sm text-muted-foreground">
              Round {latest.round} from {artistName}. Approve it, or ask for changes.
            </p>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            <Image
              src={latest.imageUrl}
              alt={`Preview round ${latest.round}`}
              fill
              preload
              sizes="(min-width: 672px) 640px, 100vw"
              className="object-cover"
            />
            <span className="absolute top-3 left-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">
              Preview · round {latest.round}
            </span>
          </div>
          <form action={approvePreviewAction.bind(null, order._id)}>
            <SubmitButton className="h-11 w-full text-base" pendingText="Approving…">
              Approve preview
            </SubmitButton>
          </form>
          <RequestChangesForm orderId={order._id} revisionsLeft={order.productSnapshot.maxRevisions - used} />
        </section>
      );
    }

    case "REVISION_REQUESTED":
      return (
        <Callout tone="info" title="Changes requested">
          {artistName} is updating your preview. You&apos;ll see the new version here.
        </Callout>
      );

    case "APPROVED":
    case "IN_PRODUCTION":
      return (
        <Callout tone="info" title="Your gift is being made">
          {artistName} is handcrafting it now, to deliver by {formatDate(order.deliverBy)}.
        </Callout>
      );

    case "SHIPPED":
      return (
        <Callout tone="info" title="On its way">
          Your gift has been shipped. Tracking details will appear here once shipping is integrated.
        </Callout>
      );

    case "DELIVERED":
    case "PAYOUT_RELEASED":
      return (
        <Callout tone="success" title="Delivered">
          We hope they love it! The payment is now released to {artistName}.
        </Callout>
      );

    default:
      return null;
  }
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: "success" | "info";
  title: string;
  children: React.ReactNode;
}) {
  const styles = tone === "success" ? "bg-emerald-50 text-emerald-900" : "bg-accent text-accent-foreground";
  return (
    <section className={`space-y-1 rounded-xl p-4 ${styles}`}>
      <h2 className="font-medium">{title}</h2>
      <p className="text-sm opacity-90">{children}</p>
    </section>
  );
}
