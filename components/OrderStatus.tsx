import { Check } from "lucide-react";
import { STATUS_STEP_INDEX, TIMELINE_STEPS, type OrderStatus as Status } from "@/lib/orderStatus";
import { cn } from "@/lib/utils";

/** Vertical progress timeline for the order tracking page. */
export function OrderStatus({ status }: { status: Status }) {
  if (status === "CANCELLED") {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
        This order was cancelled and the payment refunded.
      </p>
    );
  }

  const current = STATUS_STEP_INDEX[status];

  return (
    <ol className="space-y-0">
      {TIMELINE_STEPS.map((label, index) => {
        const done = index < current || (index === current && index === TIMELINE_STEPS.length - 1);
        const active = index === current && !done;
        return (
          <li key={label} className="relative flex gap-3 pb-4 last:pb-0">
            {index < TIMELINE_STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-6 bottom-0 left-[11px] w-0.5",
                  index < current ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2 bg-background",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary",
              )}
            >
              {done ? (
                <Check className="size-3.5" aria-hidden />
              ) : (
                active && <span className="size-2 rounded-full bg-primary" />
              )}
            </span>
            <span
              className={cn(
                "pt-0.5 text-sm",
                active ? "font-semibold" : done ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
              {active && <span className="sr-only"> (current step)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
