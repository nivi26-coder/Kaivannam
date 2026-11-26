import { describeSelections } from "@/domain/product-options";
import type { OrderWithDetails } from "@/domain/types";
import { formatDate } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { formatPhone } from "@/lib/phone";

/** What the buyer chose, plus their contact details, for the tracking page. */
export function OrderDetails({ order }: { order: OrderWithDetails }) {
  const details = describeSelections(order.optionGroups, order.selections);
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 font-heading text-lg font-semibold">Order details</h2>
      <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-2 text-sm">
        {details.map((item) => (
          <Detail key={item.label} label={item.label} value={item.value} />
        ))}
        <Detail label="Your name" value={order.buyerName} />
        <Detail label="Your mobile" value={formatPhone(order.buyerPhone)} />
        <Detail label="Placed on" value={formatDate(order.createdAt, { withYear: true })} />
        <Detail label="Total" value={formatINR(order.itemTotalPaise)} />
      </dl>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </>
  );
}
