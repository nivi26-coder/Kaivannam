import { getFeaturedArtists } from "@/server/queries";
import { ArtistCard } from "./ArtistCard";

/** Reads data: render inside <Suspense>. */
export async function FeaturedArtists() {
  const artists = await getFeaturedArtists();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {artists.map((artist) => (
        <ArtistCard key={artist._id} artist={artist} />
      ))}
    </div>
  );
}
