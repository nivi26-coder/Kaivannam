import { Suspense } from "react";
import { ArtistListSkeleton, ProductGridSkeleton } from "@/components/common/Skeletons";
import { isOccasionSlug } from "@/domain/occasions";
import { FeaturedCreators } from "@/features/catalog/components/FeaturedCreators";
import { GiftGrid } from "@/features/catalog/components/GiftGrid";
import { HomeHero } from "@/features/catalog/components/HomeHero";
import { HowItWorks } from "@/features/catalog/components/HowItWorks";
import { OccasionChips } from "@/features/catalog/components/OccasionChips";

// The page itself isn't async: the hero and "how it works" are static and
// get prerendered into an instant-loading shell. Only the parts that read
// the URL or the database are async, each behind its own <Suspense>.
export default function HomePage({ searchParams }: PageProps<"/">) {
  const occasion = searchParams.then(({ occasion }) => (isOccasionSlug(occasion) ? occasion : undefined));

  return (
    <>
      <HomeHero />

      <section id="gifts" className="mx-auto max-w-5xl scroll-mt-16 px-4 pt-10">
        <h2 className="font-heading text-2xl font-semibold">Shop by occasion</h2>
        <Suspense fallback={<OccasionChips active={null} />}>
          {occasion.then((active) => (
            <OccasionChips active={active ?? null} />
          ))}
        </Suspense>
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          {occasion.then((active) => (
            <GiftGrid occasion={active} />
          ))}
        </Suspense>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-12">
        <h2 className="font-heading text-2xl font-semibold">Meet the artists</h2>
        <p className="mt-1 text-sm text-muted-foreground">Independent makers from across Tamil Nadu.</p>
        <div className="mt-4">
          <Suspense fallback={<ArtistListSkeleton count={6} />}>
            <FeaturedCreators />
          </Suspense>
        </div>
      </section>

      <HowItWorks />
    </>
  );
}
