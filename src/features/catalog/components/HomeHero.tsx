import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { unsplash } from "@/lib/images";
import { cn } from "@/lib/utils";

const HERO_IMAGES = [
  { id: "1783509097857-bb6b7b32de29", alt: "Resin pendants with real dried flowers" },
  { id: "1771555739335-95ea325f29d2", alt: "Embroidered floral hoop" },
  { id: "1780037756323-f14d43763351", alt: "Pencil portrait sketch" },
  { id: "1773450970959-cef81e9b1053", alt: "Gift crate with flowers and treats" },
];

export function HomeHero() {
  return (
    <section className="border-b bg-secondary/50">
      <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-8 sm:py-12 md:grid-cols-2">
        <div className="space-y-4">
          <p lang="ta" className="font-tamil text-sm font-semibold text-primary">
            {siteConfig.tamilName} · {siteConfig.meaning}
          </p>
          <h1 className="font-heading text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            {siteConfig.tagline}
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
