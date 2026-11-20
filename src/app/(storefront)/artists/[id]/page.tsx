import { notFound } from "next/navigation";
import { ArtistProfileHeader } from "@/features/catalog/components/ArtistProfileHeader";
import { PausedNotice } from "@/features/catalog/components/PausedNotice";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { getArtist, getArtistProducts, getCompletedOrderCount } from "@/server/queries";

// loading.tsx in this folder wraps the page in <Suspense>, so the page can
// await the URL params and the data directly.
export default async function ArtistPage({ params }: PageProps<"/artists/[id]">) {
  const { id } = await params;

  // getArtist() returns null for ids that aren't valid ObjectIds as well as
  // for ones that don't exist, so both show the 404 page.
  const artist = await getArtist(id);
  if (!artist) notFound();

  const [products, completedOrders] = await Promise.all([
    getArtistProducts(artist._id),
    getCompletedOrderCount(artist._id),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <ArtistProfileHeader artist={artist} completedOrders={completedOrders} />

      {!artist.isAcceptingOrders && (
        <PausedNotice className="mt-5">
          {artist.name} has paused new orders for now. You can still browse their work.
        </PausedNotice>
      )}

      {artist.bio && <p className="mt-5 max-w-2xl leading-relaxed">{artist.bio}</p>}

      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold">Gifts by {artist.name.split(" ")[0]}</h2>
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
