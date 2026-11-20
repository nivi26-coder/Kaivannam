import { CirclePause, CirclePlay } from "lucide-react";
import { SubmitButton } from "@/components/common/SubmitButton";
import type { Artist } from "@/domain/types";
import { cn } from "@/lib/utils";
import { setAcceptingOrdersAction } from "../actions";

export function PauseToggle({ artist }: { artist: Artist }) {
  const accepting = artist.isAcceptingOrders;
  return (
    <section
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border p-4",
        accepting ? "bg-card" : "border-accent bg-accent/60",
      )}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-1.5 font-medium">
          {accepting ? (
            <>
              <span className="size-2 rounded-full bg-emerald-600" aria-hidden /> Accepting orders
            </>
          ) : (
            <>
              <CirclePause className="size-4" aria-hidden /> New orders paused
            </>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          {accepting
            ? "Busy season? Pause to stop new orders. Existing orders aren't affected."
            : "Buyers can see your work but can't order until you resume."}
        </p>
      </div>
      <form action={setAcceptingOrdersAction.bind(null, artist._id, !accepting)}>
        <SubmitButton variant={accepting ? "outline" : "default"} className="h-10 px-4">
          {accepting ? (
            <>
              <CirclePause aria-hidden /> Pause
            </>
          ) : (
            <>
              <CirclePlay aria-hidden /> Resume
            </>
          )}
        </SubmitButton>
      </form>
    </section>
  );
}
