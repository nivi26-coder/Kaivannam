import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span title="Verified artist" className={cn("inline-flex text-primary", className)}>
      <BadgeCheck className="size-4" aria-hidden />
      <span className="sr-only">Verified artist</span>
    </span>
  );
}
