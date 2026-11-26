import { notFound } from "next/navigation";
import { PausedNotice } from "@/features/catalog/components/PausedNotice";
import { ProductDetails } from "@/features/catalog/components/ProductDetails";
import { ProductGallery } from "@/features/catalog/components/ProductGallery";
import { CustomizationForm } from "@/features/checkout/components/CustomizationForm";
import { todayIST } from "@/lib/dates";
import { getProduct } from "@/server/queries";

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const { creator } = product;

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 lg:py-8">
      <div className="space-y-5">
        <ProductGallery images={product.images} title={product.title} />
        <ProductDetails product={product} />
      </div>

      <div className="mt-8 lg:mt-0">
        {!creator.isAcceptingOrders && (
          <PausedNotice className="mb-5">
            {creator.name} has paused new orders for now. Check back soon, or browse other artists.
          </PausedNotice>
        )}
        <CustomizationForm
          productId={product._id}
          basePricePaise={product.basePricePaise}
          baseProductionDays={product.baseProductionDays}
          optionGroups={product.optionGroups}
          maxRevisions={product.maxRevisions}
          isAcceptingOrders={creator.isAcceptingOrders}
          // Today in India, computed here at request time, so the browser's
          // clock and time zone don't affect the delivery estimate.
          today={todayIST()}
        />
      </div>
    </div>
  );
}
