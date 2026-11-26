import { notFound } from "next/navigation";
import { CreatorProfileHeader } from "@/features/catalog/components/CreatorProfileHeader";
import { PausedNotice } from "@/features/catalog/components/PausedNotice";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { getCompletedOrderCount, getCreator, getCreatorProducts } from "@/server/queries";

// loading.tsx in this folder wraps the page in <Suspense>, so the page can
// await the URL params and the data directly.
export default async function ArtistPage({ params }: PageProps<"/artists/[id]">) {
  const { id } = await params;

  // getCreator() returns null for ids that aren't valid ObjectIds as well as
  // for ones that don't exist, so both show the 404 page.
  // (The URL moves to kaivannam.in/<handle> in T5.1.)
  const creator = await getCreator(id);
  if (!creator) notFound();

  const [products, completedOrders] = await Promise.all([
    getCreatorProducts(creator._id),
    getCompletedOrderCount(creator._id),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <CreatorProfileHeader creator={creator} completedOrders={completedOrders} />

      {!creator.isAcceptingOrders && (
        <PausedNotice className="mt-5">
          {creator.name} has paused new orders for now. You can still browse their work.
        </PausedNotice>
      )}

      {creator.bio && <p className="mt-5 max-w-2xl leading-relaxed">{creator.bio}</p>}

      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold">Gifts by {creator.name.split(" ")[0]}</h2>
        {products.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No gifts listed yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
