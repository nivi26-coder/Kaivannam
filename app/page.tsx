import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Baby,
  Cake,
  Flame,
  Gem,
  Heart,
  HeartHandshake,
  MessageSquare,
  Palette,
  Ribbon,
  ShieldCheck,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { ArtistCard } from "@/components/ArtistCard";
import { ProductCard } from "@/components/ProductCard";
import { ArtistListSkeleton, ProductGridSkeleton } from "@/components/Skeletons";
import { getFeaturedArtists, getProducts } from "@/lib/data";
import { unsplash } from "@/lib/images";
import { getOccasion, isOccasionSlug, OCCASIONS, type OccasionSlug } from "@/lib/occasions";
import { cn } from "@/lib/utils";

// The page itself isn't async: the hero and "how it works" are static and
// get prerendered into an instant-loading shell. Only the parts that read
// the URL or the database are async, each behind its own <Suspense>.
export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <Hero />

      <section id="gifts" className="mx-auto max-w-5xl scroll-mt-16 px-4 pt-10">
        <h2 className="font-heading text-2xl font-semibold">Shop by occasion</h2>
        <Suspense fallback={<OccasionChips active={null} />}>
          {searchParams.then(({ occasion }) => (
            <OccasionChips active={isOccasionSlug(occasion) ? occasion : null} />
          ))}
        </Suspense>
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <GiftGrid searchParams={searchParams} />
        </Suspense>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-12">
        <h2 className="font-heading text-2xl font-semibold">Meet the artists</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Independent makers from across Tamil Nadu.
        </p>
        <div className="mt-4">
          <Suspense fallback={<ArtistListSkeleton count={6} />}>
            <FeaturedArtists />
          </Suspense>
        </div>
      </section>

      <HowItWorks />
    </>
  );
}

// ------------------------------------------------------------------- hero

const HERO_IMAGES = [
  { id: "1783509097857-bb6b7b32de29", alt: "Resin pendants with real dried flowers" },
  { id: "1771555739335-95ea325f29d2", alt: "Embroidered floral hoop" },
  { id: "1780037756323-f14d43763351", alt: "Pencil portrait sketch" },
  { id: "1773450970959-cef81e9b1053", alt: "Gift crate with flowers and treats" },
];

function Hero() {
  return (
    <section className="border-b bg-secondary/50">
      <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-8 sm:py-12 md:grid-cols-2">
        <div className="space-y-4">
          <p lang="ta" className="font-tamil text-sm font-semibold text-primary">
            கைவண்ணம் · the artistry of the hand
          </p>
          <h1 className="font-heading text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Handmade gifts, made just for you.
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Resin keepsakes, portraits, embroidery and hampers from Tamil Nadu artists. Customise
            it, approve a preview, and pay safely — no more DMing ten accounts for a price.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="#gifts"
              className="inline-flex h-11 items-center rounded-lg bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/85"
            >
              Find a gift
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center rounded-lg border bg-background px-5 font-medium hover:bg-muted"
            >
              I&apos;m an artist
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {HERO_IMAGES.map((image, index) => (
            <div
              key={image.id}
              className={cn(
                "relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm",
                index % 2 === 1 && "translate-y-4",
              )}
            >
              <Image
                src={unsplash(image.id)}
                alt={image.alt}
                fill
                preload={index < 2}
                sizes="(min-width: 768px) 240px, 45vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------- occasions

const OCCASION_ICONS: Record<OccasionSlug, LucideIcon> = {
  birthday: Cake,
  anniversary: Heart,
  wedding: Gem,
  baby: Baby,
  rakhi: Ribbon,
  diwali: Flame,
  valentines: HeartHandshake,
  pongal: Wheat,
};

function OccasionChips({ active }: { active: OccasionSlug | null }) {
  return (
    // Scrolls sideways on phones instead of wrapping into many rows.
    <nav aria-label="Occasions" className="-mx-4 mt-3 overflow-x-auto px-4 pb-2">
      <ul className="flex w-max gap-2">
        <li>
          <Link
            href="/#gifts"
            scroll={false}
            className={cn(
              "flex h-full items-center rounded-full border px-4 py-2 text-sm font-medium",
              active === null ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            All gifts
          </Link>
        </li>
        {OCCASIONS.map((occasion) => {
          const Icon = OCCASION_ICONS[occasion.slug];
          const isActive = occasion.slug === active;
          return (
            <li key={occasion.slug}>
              <Link
                href={`/?occasion=${occasion.slug}#gifts`}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2",
                  isActive ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="text-sm font-medium">{occasion.label}</span>
                <span lang="ta" className={cn("font-tamil text-xs", !isActive && "text-muted-foreground")}>
                  {occasion.tamil}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

async function GiftGrid({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { occasion: raw } = await searchParams;
  const occasion = isOccasionSlug(raw) ? raw : undefined;
  const products = await getProducts({ occasion });

  return (
    <div className="mt-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
        {occasion ? `${products.length} gifts for ${getOccasion(occasion).label}` : "Popular right now"}
      </h3>
      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No gifts for this occasion yet. Artists are adding new ones every week.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} artist={product.artist} />
          ))}
        </div>
      )}
    </div>
  );
}

async function FeaturedArtists() {
  const artists = await getFeaturedArtists();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {artists.map((artist) => (
        <ArtistCard key={artist._id} artist={artist} />
      ))}
    </div>
  );
}

// ----------------------------------------------------------- how it works

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Palette,
    title: "Customise",
    body: "Pick options, add names and photos, and see the exact price instantly.",
  },
  {
    icon: MessageSquare,
    title: "Approve a preview",
    body: "The artist sends a mockup first. Ask for changes until it's right.",
  },
  {
    icon: ShieldCheck,
    title: "Pay safely",
    body: "Kaivannam holds your payment and releases it to the artist only after delivery.",
  },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-14">
      <h2 className="font-heading text-2xl font-semibold">Why order here, not on Instagram?</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }, index) => (
          <li key={title} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
            </div>
            <h3 className="mt-3 font-medium">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
