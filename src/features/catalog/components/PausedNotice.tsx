import { CirclePause } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shown when an artist has paused new orders. */
export function PausedNotice({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground",
        className,
      )}
    >
      <CirclePause className="mt-0.5 size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
