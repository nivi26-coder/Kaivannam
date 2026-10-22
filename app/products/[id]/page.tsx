import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CirclePause, Clock, RotateCcw } from "lucide-react";
import { ArtistAvatar } from "@/components/ArtistAvatar";
import { CustomizationForm } from "@/components/CustomizationForm";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { getProduct } from "@/lib/data";
import { earliestDeliveryYmd } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { getOccasion } from "@/lib/occasions";

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const { artist } = product;
  // Computed here, at request time and in Indian time, then handed to the
  // form, so the browser's clock and time zone don't matter.
  const minDeliverBy = earliestDeliveryYmd(artist.makingTimeDays);

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 lg:py-8">
      <div className="space-y-5">
        {/* Swipeable on phones; a simple grid on large screens. */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-2 lg:overflow-visible">
          {product.images.map((src, index) => (
            <div
              key={src}
              className="relative aspect-square w-[85%] shrink-0 snap-center overflow-hidden rounded-xl bg-muted sm:w-full lg:first:col-span-2"
            >
              <Image
                src={src}
                alt={index === 0 ? product.title : `${product.title}, photo ${index + 1}`}
                fill
                preload={index === 0}
                sizes="(min-width: 1024px) 480px, 85vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl leading-tight font-semibold sm:text-3xl">
            {product.title}
          </h1>
          <p className="text-lg">
            <span className="text-muted-foreground">from </span>
            <span className="font-semibold">{formatINR(product.basePrice)}</span>
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-1">
              <Clock className="size-4" aria-hidden />
              Made in {artist.makingTimeDays} days
            </li>
            <li className="inline-flex items-center gap-1">
              <RotateCcw className="size-4" aria-hidden />
              {product.maxRevisions} free preview {product.maxRevisions === 1 ? "revision" : "revisions"}
            </li>
          </ul>
        </div>

        <Link
          href={`/artists/${artist._id}`}
          className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-secondary/40"
        >
          <ArtistAvatar name={artist.name} avatarUrl={artist.avatarUrl} size={44} />
          <div className="min-w-0">
            <p className="flex items-center gap-1 font-medium">
              {artist.name}
              {artist.isVerified && <VerifiedBadge />}
            </p>
            <p className="text-sm text-muted-foreground">{artist.city} · View profile</p>
          </div>
        </Link>

        {product.description && (
          <p className="leading-relaxed whitespace-pre-line">{product.description}</p>
        )}

        {product.occasionTags.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Good for">
            {product.occasionTags.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/?occasion=${slug}#gifts`}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-accent"
                >
                  {getOccasion(slug).label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 lg:mt-0">
        {!artist.isAcceptingOrders && (
          <p className="mb-5 flex items-start gap-2 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
            <CirclePause className="mt-0.5 size-4 shrink-0" aria-hidden />
            {artist.name} has paused new orders for now. Check back soon, or browse other artists.
          </p>
        )}
        <CustomizationForm
          productId={product._id}
          basePrice={product.basePrice}
          customFields={product.customFields}
          maxRevisions={product.maxRevisions}
          artistName={artist.name}
          makingTimeDays={artist.makingTimeDays}
          isAcceptingOrders={artist.isAcceptingOrders}
          minDeliverBy={minDeliverBy}
        />
      </div>
    </div>
  );
}
