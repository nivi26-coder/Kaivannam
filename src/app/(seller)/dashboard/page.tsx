import type { Metadata } from "next";
import { summarizeSellerOrders } from "@/domain/seller-dashboard";
import { ArtistPicker } from "@/features/seller/components/ArtistPicker";
import { CompletedOrders } from "@/features/seller/components/CompletedOrders";
import { DashboardHeader } from "@/features/seller/components/DashboardHeader";
import { PauseToggle } from "@/features/seller/components/PauseToggle";
import { SellerOrderCard } from "@/features/seller/components/SellerOrderCard";
import { SellerStats } from "@/features/seller/components/SellerStats";
import { todayIST } from "@/lib/dates";
import { getArtist, getArtistOrders } from "@/server/queries";

export const metadata: Metadata = { title: "Artist dashboard" };

// DEMO: there's no login yet, so the artist is chosen with ?artist=<id>.
// In the MVP this comes from the signed-in user's session instead.
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { artist: artistId } = await searchParams;
  if (typeof artistId !== "string" || !artistId) return <ArtistPicker />;

  const artist = await getArtist(artistId);
  if (!artist) return <ArtistPicker notice="That artist wasn't found. Pick one below." />;

  const today = todayIST();
  const { active, completed, dueThisWeek, held } = summarizeSellerOrders(
    await getArtistOrders(artist._id),
    today,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <DashboardHeader artist={artist} />
      <PauseToggle artist={artist} />
      <SellerStats activeCount={active.length} dueThisWeek={dueThisWeek} held={held} />

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
                <SellerOrderCard order={order} today={today} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <CompletedOrders orders={completed} />
    </div>
  );
}
