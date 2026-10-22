import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import type { ArtistDTO } from "@/lib/types";
import { ArtistAvatar } from "./ArtistAvatar";
import { VerifiedBadge } from "./VerifiedBadge";

export function ArtistCard({
  artist,
  href = `/artists/${artist._id}`,
}: {
  artist: ArtistDTO;
  /** Where the card links to; the public profile by default. */
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="flex gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-secondary/40"
    >
      <ArtistAvatar name={artist.name} avatarUrl={artist.avatarUrl} size={56} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-1">
          <h3 className="truncate font-medium">{artist.name}</h3>
          {artist.isVerified && <VerifiedBadge />}
        </div>
        <p className="truncate text-sm text-muted-foreground">{artist.categories.join(" · ")}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" aria-hidden />
            {artist.city}
          </span>
          {artist.isAcceptingOrders ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden />
              Makes in {artist.makingTimeDays} days
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium">Orders paused</span>
          )}
        </div>
      </div>
    </Link>
  );
}
