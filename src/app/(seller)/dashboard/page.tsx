import type { Metadata } from "next";
import { summarizeSellerOrders } from "@/domain/seller-dashboard";
import { CreatorPicker } from "@/features/seller/components/CreatorPicker";
import { CompletedOrders } from "@/features/seller/components/CompletedOrders";
import { DashboardHeader } from "@/features/seller/components/DashboardHeader";
import { PauseToggle } from "@/features/seller/components/PauseToggle";
import { SellerOrderCard } from "@/features/seller/components/SellerOrderCard";
import { SellerStats } from "@/features/seller/components/SellerStats";
import { todayIST } from "@/lib/dates";
import { getCreator, getCreatorOrders } from "@/server/queries";

export const metadata: Metadata = { title: "Artist dashboard" };

// DEMO: there's no login yet, so the creator is chosen with ?artist=<id>.
// In the MVP this comes from the signed-in user's session instead.
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { artist: creatorId } = await searchParams;
  if (typeof creatorId !== "string" || !creatorId) return <CreatorPicker />;

  const creator = await getCreator(creatorId);
  if (!creator) return <CreatorPicker notice="That artist wasn't found. Pick one below." />;

  const today = todayIST();
  const { active, completed, dueThisWeek, heldPaise } = summarizeSellerOrders(
    await getCreatorOrders(creator._id),
    today,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <DashboardHeader creator={creator} />
      <PauseToggle creator={creator} />
      <SellerStats activeCount={active.length} dueThisWeek={dueThisWeek} heldPaise={heldPaise} />

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
