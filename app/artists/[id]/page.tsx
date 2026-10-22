import { notFound } from "next/navigation";
import { CirclePause, Clock, MapPin, Package } from "lucide-react";
import { ArtistAvatar } from "@/components/ArtistAvatar";
import { ProductCard } from "@/components/ProductCard";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { getArtist, getArtistProducts, getCompletedOrderCount } from "@/lib/data";

// loading.tsx in this folder wraps the page in <Suspense>, so the page can
// await the URL params and the database directly.
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
      <header className="flex items-start gap-4">
        <ArtistAvatar name={artist.name} avatarUrl={artist.avatarUrl} size={80} />
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <h1 className="font-heading text-2xl font-semibold">{artist.name}</h1>
            {artist.isVerified && <VerifiedBadge />}
          </div>
          <p className="text-sm text-muted-foreground">{artist.categories.join(" · ")}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-1">
              <MapPin className="size-4" aria-hidden />
              {artist.city}, {artist.state}
            </li>
            <li className="inline-flex items-center gap-1">
              <Clock className="size-4" aria-hidden />
              Makes in {artist.makingTimeDays} days
            </li>
            <li className="inline-flex items-center gap-1">
              <Package className="size-4" aria-hidden />
              {completedOrders} {completedOrders === 1 ? "order" : "orders"} delivered via Kaivannam
            </li>
          </ul>
        </div>
      </header>

      {!artist.isAcceptingOrders && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
          <CirclePause className="mt-0.5 size-4 shrink-0" aria-hidden />
          {artist.name} has paused new orders for now. You can still browse their work.
        </p>
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
