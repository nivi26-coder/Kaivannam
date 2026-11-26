import Link from "next/link";
import { Clock, RotateCcw } from "lucide-react";
import { getOccasion } from "@/domain/occasions";
import { startingPrice } from "@/domain/pricing";
import { isChoiceGroup } from "@/domain/product-options";
import type { ProductWithCreator } from "@/domain/types";
import { formatINR } from "@/lib/format";
import { CreatorAvatar } from "./CreatorAvatar";
import { VerifiedBadge } from "./VerifiedBadge";

/** Title, price, creator and description shown next to the product photos. */
export function ProductDetails({ product }: { product: ProductWithCreator }) {
  const { creator } = product;
  // "7+ days" when some options add making time.
  const optionsAddDays = product.optionGroups.some(
    (group) => isChoiceGroup(group) && group.options.some((option) => option.extraDays > 0),
  );
  return (
    <>
      <div className="space-y-2">
        <h1 className="font-heading text-2xl leading-tight font-semibold sm:text-3xl">
          {product.title}
        </h1>
        <p className="text-lg">
          <span className="text-muted-foreground">from </span>
          <span className="font-semibold">{formatINR(startingPrice(product))}</span>
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <li className="inline-flex items-center gap-1">
            <Clock className="size-4" aria-hidden />
            Made in {product.baseProductionDays}
            {optionsAddDays ? "+" : ""} days
          </li>
          <li className="inline-flex items-center gap-1">
            <RotateCcw className="size-4" aria-hidden />
            {product.maxRevisions} free preview {product.maxRevisions === 1 ? "revision" : "revisions"}
          </li>
        </ul>
      </div>

      <Link
        href={`/artists/${creator._id}`}
        className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-secondary/40"
      >
        <CreatorAvatar name={creator.name} avatarUrl={creator.avatarUrl} size={44} />
        <div className="min-w-0">
          <p className="flex items-center gap-1 font-medium">
            {creator.name}
            {creator.isVerified && <VerifiedBadge />}
          </p>
          <p className="text-sm text-muted-foreground">{creator.city} · View profile</p>
        </div>
      </Link>

      {product.description && <p className="leading-relaxed whitespace-pre-line">{product.description}</p>}

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
    </>
  );
}
