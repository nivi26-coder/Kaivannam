import { getOccasion, type OccasionSlug } from "@/domain/occasions";
import { getProducts } from "@/server/queries";
import { ProductCard } from "./ProductCard";

/** Products for an occasion (or all). Reads data: render inside <Suspense>. */
export async function GiftGrid({ occasion }: { occasion?: OccasionSlug }) {
  const products = await getProducts({ occasion });

  return (
    <div className="mt-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
        {occasion ? `${products.length} gifts for ${getOccasion(occasion).label}` : "Popular right now"}
      </h3>
      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No gifts for this occasion yet. Artists are adding new ones every week.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} artist={product.artist} />
          ))}
        </div>
      )}
    </div>
  );
}
