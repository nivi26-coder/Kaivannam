import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, ShieldCheck } from "lucide-react";
import { approvePreview, payOrderDemo } from "@/app/actions/orders";
import { OrderStatus } from "@/components/OrderStatus";
import { RequestChangesForm } from "@/components/RequestChangesForm";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { describeInputs } from "@/lib/customFields";
import { getOrder } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { formatINR, orderRef } from "@/lib/format";
import type { OrderWithDetails } from "@/lib/types";
import { formatPhone } from "@/lib/validation";

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const artistName = order.artist?.name ?? "The artist";
  const details = describeInputs(order.customFields, order.inputs);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Order {orderRef(order._id)}</p>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex gap-4">
          {order.productSnapshot.imageUrl && (
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image
                src={order.productSnapshot.imageUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <h1 className="font-heading text-xl leading-snug font-semibold">
              {order.productSnapshot.title}
            </h1>
            {order.artist && (
              <p className="text-sm text-muted-foreground">
                by{" "}
                <Link href={`/artists/${order.artist._id}`} className="underline underline-offset-2">
                  {order.artist.name}
                </Link>
              </p>
            )}
            <p className="text-sm">
              <span className="font-semibold">{formatINR(order.totalPrice)}</span>
              <span className="text-muted-foreground">
                {" "}
                · deliver by {formatDate(order.deliverBy)}
              </span>
            </p>
          </div>
        </div>
      </header>

      <NextStep order={order} artistName={artistName} />

      {order.previews.length > 0 && <PreviewHistory order={order} />}

      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-4 font-heading text-lg font-semibold">Progress</h2>
        <OrderStatus status={order.status} />
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-heading text-lg font-semibold">Order details</h2>
        <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-2 text-sm">
          {details.map((item) => (
            <Detail key={item.label} label={item.label} value={item.value} />
          ))}
          <Detail label="Your name" value={order.buyerName} />
          <Detail label="Your mobile" value={formatPhone(order.buyerPhone)} />
          <Detail label="Placed on" value={formatDate(order.createdAt, { withYear: true })} />
          <Detail label="Total" value={formatINR(order.totalPrice)} />
        </dl>
      </section>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Bookmark className="size-4 shrink-0" aria-hidden />
        Bookmark this page — it&apos;s how you get back to your order in this demo (there are no
        logins yet).
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </>
  );
}

/** The one thing the buyer should know or do right now. */
function NextStep({ order, artistName }: { order: OrderWithDetails; artistName: string }) {
  switch (order.status) {
    case "PLACED":
      return (
        <section className="space-y-3 rounded-xl border-2 border-primary/30 bg-card p-4">
          <h2 className="font-heading text-lg font-semibold">
            Pay {formatINR(order.totalPrice)} to confirm
          </h2>
          <p className="flex gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-5 shrink-0 text-emerald-700" aria-hidden />
            Kaivannam holds your money safely. {artistName} is paid only after your gift is
            delivered.
          </p>
          <form action={payOrderDemo.bind(null, order._id)}>
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
          {artistName} is working on a preview of your gift. You&apos;ll see it here to approve
          before anything is made.
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
          <form action={approvePreview.bind(null, order._id)}>
            <SubmitButton className="h-11 w-full text-base" pendingText="Approving…">
              Approve preview
            </SubmitButton>
          </form>
          <RequestChangesForm
            orderId={order._id}
            revisionsLeft={order.productSnapshot.maxRevisions - used}
          />
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
          Your gift has been shipped. Tracking details will appear here once shipping is
          integrated.
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

function PreviewHistory({ order }: { order: OrderWithDetails }) {
  // While a preview is waiting, it's already shown large in NextStep.
  const previews =
    order.status === "PREVIEW_SENT" ? order.previews.slice(0, -1) : order.previews;
  if (previews.length === 0) return null;

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 font-heading text-lg font-semibold">Previews</h2>
      <ul className="space-y-3">
        {previews
          .slice()
          .reverse()
          .map((preview) => (
            <li key={preview.round} className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={preview.imageUrl} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 text-sm">
                <p className="font-medium">
                  Round {preview.round}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {formatDate(preview.createdAt)}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  {preview.response === "approved"
                    ? "Approved"
                    : preview.response === "changes_requested"
                      ? "Changes requested"
                      : "Waiting for your response"}
                </p>
                {preview.comment && <p className="mt-1 italic">&ldquo;{preview.comment}&rdquo;</p>}
              </div>
            </li>
          ))}
      </ul>
    </section>
  );
}
