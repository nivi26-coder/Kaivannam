import Image from "next/image";
import Link from "next/link";
import { startingPrice } from "@/domain/pricing";
import type { CreatorSummary, Product } from "@/domain/types";
import { formatINR } from "@/lib/format";

export function ProductCard({
  product,
  creator,
}: {
  product: Product;
  /** Omit on the creator's own profile, where the name would be repetitive. */
  creator?: CreatorSummary;
}) {
  return (
    <Link href={`/products/${product._id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {creator && !creator.isAcceptingOrders && (
          <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">
            Orders paused
          </span>
        )}
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium">{product.title}</h3>
        {creator && (
          <p className="truncate text-xs text-muted-foreground">
            by {creator.name} · {creator.city}
          </p>
        )}
        <p className="text-sm font-semibold">
          <span className="font-normal text-muted-foreground">from </span>
          {formatINR(startingPrice(product))}
        </p>
      </div>
    </Link>
  );
}
