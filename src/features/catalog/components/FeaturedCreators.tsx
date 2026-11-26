import { getFeaturedCreators } from "@/server/queries";
import { CreatorCard } from "./CreatorCard";

/** Reads data: render inside <Suspense>. */
export async function FeaturedCreators() {
  const creators = await getFeaturedCreators();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {creators.map((creator) => (
        <CreatorCard key={creator._id} creator={creator} />
      ))}
    </div>
  );
}
