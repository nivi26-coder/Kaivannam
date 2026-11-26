import { AtSign, MapPin, Package } from "lucide-react";
import type { Creator } from "@/domain/types";
import { CreatorAvatar } from "./CreatorAvatar";
import { VerifiedBadge } from "./VerifiedBadge";

export function CreatorProfileHeader({
  creator,
  completedOrders,
}: {
  creator: Creator;
  completedOrders: number;
}) {
  return (
    <header className="flex items-start gap-4">
      <CreatorAvatar name={creator.name} avatarUrl={creator.avatarUrl} size={80} />
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-1.5">
          <h1 className="font-heading text-2xl font-semibold">{creator.name}</h1>
          {creator.isVerified && <VerifiedBadge />}
        </div>
        <p className="text-sm text-muted-foreground">{creator.categories.join(" · ")}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <li className="inline-flex items-center gap-1">
            <MapPin className="size-4" aria-hidden />
            {creator.city}, {creator.state}
          </li>
          <li className="inline-flex items-center gap-1">
            <AtSign className="size-4" aria-hidden />
            {creator.handle}
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
