import Link from "next/link";
import {
  Baby,
  Cake,
  Flame,
  Gem,
  Heart,
  HeartHandshake,
  Ribbon,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { OCCASIONS, type OccasionSlug } from "@/domain/occasions";
import { cn } from "@/lib/utils";

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

export function OccasionChips({ active }: { active: OccasionSlug | null }) {
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
