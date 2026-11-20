import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Artist } from "@/domain/types";
import { ArtistAvatar } from "@/features/catalog/components/ArtistAvatar";

export function DashboardHeader({ artist }: { artist: Artist }) {
  return (
    <header className="flex items-center gap-3">
      <ArtistAvatar name={artist.name} avatarUrl={artist.avatarUrl} size={52} />
      <div className="min-w-0 flex-1">
        <h1 className="font-heading text-2xl font-semibold">Vanakkam, {artist.name.split(" ")[0]}</h1>
        <div className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
          <Link href={`/artists/${artist._id}`} className="inline-flex items-center gap-1 hover:underline">
            Public profile <ExternalLink className="size-3" aria-hidden />
          </Link>
          {/* DEMO: no login, so artists are picked from a list. */}
          <Link href="/dashboard" className="hover:underline">
            Switch artist (demo)
          </Link>
        </div>
      </div>
    </header>
  );
}
