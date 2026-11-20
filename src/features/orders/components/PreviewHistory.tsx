import Image from "next/image";
import type { OrderWithDetails } from "@/domain/types";
import { formatDate } from "@/lib/dates";

/** Earlier preview rounds and how the buyer answered them. */
export function PreviewHistory({ order }: { order: OrderWithDetails }) {
  // While a preview is waiting, it's already shown large in OrderNextStep.
  const previews = order.status === "PREVIEW_SENT" ? order.previews.slice(0, -1) : order.previews;
  if (previews.length === 0) return null;

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 font-heading text-lg font-semibold">Previews</h2>
      <ul className="space-y-3">
        {previews
          .slice()
          .reverse()
          .map((preview) => (
            <li key={preview.round} className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={preview.imageUrl} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 text-sm">
                <p className="font-medium">
                  Round {preview.round}
                  <span className="font-normal text-muted-foreground"> · {formatDate(preview.createdAt)}</span>
                </p>
                <p className="text-muted-foreground">
                  {preview.response === "approved"
                    ? "Approved"
                    : preview.response === "changes_requested"
                      ? "Changes requested"
                      : "Waiting for your response"}
                </p>
                {preview.comment && <p className="mt-1 italic">&ldquo;{preview.comment}&rdquo;</p>}
              </div>
            </li>
          ))}
      </ul>
    </section>
  );
}
