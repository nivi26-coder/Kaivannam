import { formatINR } from "@/lib/format";

export function SellerStats({
  activeCount,
  dueThisWeek,
  heldPaise,
}: {
  activeCount: number;
  dueThisWeek: number;
  heldPaise: number;
}) {
  return (
    <dl className="grid grid-cols-3 gap-3">
      <Stat label="Active orders" value={String(activeCount)} />
      <Stat label="Ship in 7 days" value={String(dueThisWeek)} />
      <Stat label="Held for you" value={formatINR(heldPaise)} />
    </dl>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">{value}</dd>
    </div>
  );
}
