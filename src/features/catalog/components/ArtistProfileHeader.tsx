import { Clock, MapPin, Package } from "lucide-react";
import type { Artist } from "@/domain/types";
import { ArtistAvatar } from "./ArtistAvatar";
import { VerifiedBadge } from "./VerifiedBadge";

export function ArtistProfileHeader({
  artist,
  completedOrders,
}: {
  artist: Artist;
  completedOrders: number;
}) {
  return (
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
  );
}
