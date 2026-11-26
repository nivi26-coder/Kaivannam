import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Creator } from "@/domain/types";
import { CreatorAvatar } from "@/features/catalog/components/CreatorAvatar";

export function DashboardHeader({ creator }: { creator: Creator }) {
  return (
    <header className="flex items-center gap-3">
      <CreatorAvatar name={creator.name} avatarUrl={creator.avatarUrl} size={52} />
      <div className="min-w-0 flex-1">
        <h1 className="font-heading text-2xl font-semibold">Vanakkam, {creator.name.split(" ")[0]}</h1>
        <div className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
          <Link href={`/artists/${creator._id}`} className="inline-flex items-center gap-1 hover:underline">
            Public profile <ExternalLink className="size-3" aria-hidden />
          </Link>
          {/* DEMO: no login, so creators are picked from a list. */}
          <Link href="/dashboard" className="hover:underline">
            Switch artist (demo)
          </Link>
        </div>
      </div>
    </header>
  );
}
