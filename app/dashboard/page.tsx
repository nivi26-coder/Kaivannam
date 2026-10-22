import type { Metadata } from "next";
import Link from "next/link";
import { CirclePause, CirclePlay, ExternalLink, MessageSquare } from "lucide-react";
import { setAcceptingOrders } from "@/app/actions/artists";
import { advanceOrder, sendPreview } from "@/app/actions/orders";
import { ArtistAvatar } from "@/components/ArtistAvatar";
import { ArtistCard } from "@/components/ArtistCard";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { describeInputs } from "@/lib/customFields";
import { getAllArtists, getArtist, getArtistOrders } from "@/lib/data";
import { daysBetween, formatDate, todayIST, toYmdIST } from "@/lib/dates";
import { formatINR, orderRef } from "@/lib/format";
import { ACTIVE_STATUSES, ARTIST_ADVANCE, CAN_SEND_PREVIEW } from "@/lib/orderStatus";
import type { ArtistDTO, OrderWithDetails } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/validation";

export const metadata: Metadata = { title: "Artist dashboard" };

// DEMO: there's no login yet, so the artist is chosen with ?artist=<id>.
// In the MVP this comes from the signed-in user's session instead.
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { artist: artistId } = await searchParams;

  if (typeof artistId !== "string" || !artistId) {
    return <ArtistPicker />;
  }

  const artist = await getArtist(artistId);
  if (!artist) {
    return <ArtistPicker notice="That artist wasn't found. Pick one below." />;
  }

  const orders = await getArtistOrders(artist._id);
  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const past = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status)).reverse();
  const today = todayIST();

  const dueThisWeek = active.filter((o) => daysBetween(today, toYmdIST(o.deliverBy)) <= 7).length;
  // Money the buyer has paid that Kaivannam is holding until delivery.
  const held = active
    .filter((o) => o.status !== "PLACED")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <header className="flex items-center gap-3">
        <ArtistAvatar name={artist.name} avatarUrl={artist.avatarUrl} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl font-semibold">
            Vanakkam, {artist.name.split(" ")[0]}
          </h1>
          <div className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
            <Link href={`/artists/${artist._id}`} className="inline-flex items-center gap-1 hover:underline">
              Public profile <ExternalLink className="size-3" aria-hidden />
            </Link>
            <Link href="/dashboard" className="hover:underline">
              Switch artist (demo)
            </Link>
          </div>
        </div>
      </header>

      <PauseToggle artist={artist} />

      <dl className="grid grid-cols-3 gap-3">
        <Stat label="Active orders" value={String(active.length)} />
        <Stat label="Due in 7 days" value={String(dueThisWeek)} />
        <Stat label="Held for you" value={formatINR(held)} />
      </dl>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Active orders</h2>
        {active.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No active orders right now.
          </p>
        ) : (
          <ul className="space-y-3">
            {active.map((order) => (
              <li key={order._id}>
                <OrderCard order={order} today={today} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Completed</h2>
          <ul className="divide-y rounded-xl border bg-card">
            {past.map((order) => (
              <li key={order._id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{order.productSnapshot.title}</p>
                  <p className="text-muted-foreground">
                    {order.buyerName} · {formatDate(order.deliverBy)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatINR(order.totalPrice)}</p>
                  <StatusBadge status={order.status} audience="artist" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">{value}</dd>
    </div>
  );
}

function PauseToggle({ artist }: { artist: ArtistDTO }) {
  const accepting = artist.isAcceptingOrders;
  return (
    <section
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border p-4",
        accepting ? "bg-card" : "border-accent bg-accent/60",
      )}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-1.5 font-medium">
          {accepting ? (
            <>
              <span className="size-2 rounded-full bg-emerald-600" aria-hidden /> Accepting orders
            </>
          ) : (
            <>
              <CirclePause className="size-4" aria-hidden /> New orders paused
            </>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          {accepting
            ? "Busy season? Pause to stop new orders. Existing orders aren't affected."
            : "Buyers can see your work but can't order until you resume."}
        </p>
      </div>
      <form action={setAcceptingOrders.bind(null, artist._id, !accepting)}>
        <SubmitButton variant={accepting ? "outline" : "default"} className="h-10 px-4">
          {accepting ? (
            <>
              <CirclePause aria-hidden /> Pause
            </>
          ) : (
            <>
              <CirclePlay aria-hidden /> Resume
            </>
          )}
        </SubmitButton>
      </form>
    </section>
  );
}

function DeadlineChip({ deliverBy, today }: { deliverBy: string; today: string }) {
  const days = daysBetween(today, toYmdIST(deliverBy));
  const [text, tone] =
    days < 0
      ? [`Overdue by ${-days} ${days === -1 ? "day" : "days"}`, "bg-red-100 text-red-800"]
      : days === 0
        ? ["Due today", "bg-red-100 text-red-800"]
        : days <= 3
          ? [`${days} ${days === 1 ? "day" : "days"} left`, "bg-amber-100 text-amber-900"]
          : [`${days} days left`, "bg-muted text-muted-foreground"];
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", tone)}>{text}</span>;
}

function OrderCard({ order, today }: { order: OrderWithDetails; today: string }) {
  const details = describeInputs(order.customFields, order.inputs);
  const lastPreview = order.previews.at(-1);
  const advance = ARTIST_ADVANCE[order.status];

  return (
    <article className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium">{order.productSnapshot.title}</h3>
          <p className="text-sm text-muted-foreground">
            {orderRef(order._id)} · {formatINR(order.totalPrice)}
          </p>
        </div>
        <StatusBadge status={order.status} audience="artist" />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Deliver by {formatDate(order.deliverBy)}</span>
        <DeadlineChip deliverBy={order.deliverBy} today={today} />
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
        <form action={sendPreview.bind(null, order._id)} className="space-y-1">
          <SubmitButton className="h-10 w-full" pendingText="Sending…">
            {order.status === "REVISION_REQUESTED" ? "Send revised preview" : "Send preview"}
          </SubmitButton>
          <p className="text-center text-xs text-muted-foreground">
            Demo: sends a placeholder image instead of an upload.
          </p>
        </form>
      )}

      {advance && (
        <form action={advanceOrder.bind(null, order._id, order.status)}>
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

async function ArtistPicker({ notice }: { notice?: string }) {
  const artists = await getAllArtists();
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Artist dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          There are no logins in this demo. Pick an artist to see their orders, deadlines and the
          pause toggle.
        </p>
      </div>
      {notice && <p className="rounded-lg bg-accent px-3 py-2 text-sm">{notice}</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {artists.map((artist) => (
          <li key={artist._id}>
            <ArtistCard artist={artist} href={`/dashboard?artist=${artist._id}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
