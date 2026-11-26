import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Creator } from "@/domain/types";
import { CreatorAvatar } from "./CreatorAvatar";
import { VerifiedBadge } from "./VerifiedBadge";

export function CreatorCard({
  creator,
  href = `/artists/${creator._id}`,
}: {
  creator: Creator;
  /** Where the card links to; the public profile by default. */
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="flex gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-secondary/40"
    >
      <CreatorAvatar name={creator.name} avatarUrl={creator.avatarUrl} size={56} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-1">
          <h3 className="truncate font-medium">{creator.name}</h3>
          {creator.isVerified && <VerifiedBadge />}
        </div>
        <p className="truncate text-sm text-muted-foreground">{creator.categories.join(" · ")}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" aria-hidden />
            {creator.city}
          </span>
          {creator.isAcceptingOrders ? (
            <span>@{creator.handle}</span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium">Orders paused</span>
          )}
        </div>
      </div>
    </Link>
  );
}
