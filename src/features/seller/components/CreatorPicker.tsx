import { CreatorCard } from "@/features/catalog/components/CreatorCard";
import { getAllCreators } from "@/server/queries";

/**
 * DEMO: there's no login, so the dashboard starts by asking which creator you
 * are. In the MVP the creator comes from the signed-in session instead.
 */
export async function CreatorPicker({ notice }: { notice?: string }) {
  const creators = await getAllCreators();
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Artist dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          There are no logins in this demo. Pick an artist to see their orders, deadlines and the
          pause toggle.
        </p>
      </div>
      {notice && <p className="rounded-lg bg-accent px-3 py-2 text-sm">{notice}</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {creators.map((creator) => (
          <li key={creator._id}>
            <CreatorCard creator={creator} href={`/dashboard?artist=${creator._id}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
