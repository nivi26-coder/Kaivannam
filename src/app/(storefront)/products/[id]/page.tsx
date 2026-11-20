import { notFound } from "next/navigation";
import { deliveryWindow } from "@/domain/delivery";
import { PausedNotice } from "@/features/catalog/components/PausedNotice";
import { ProductDetails } from "@/features/catalog/components/ProductDetails";
import { ProductGallery } from "@/features/catalog/components/ProductGallery";
import { CustomizationForm } from "@/features/checkout/components/CustomizationForm";
import { getProduct } from "@/server/queries";

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const { artist } = product;

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 lg:py-8">
      <div className="space-y-5">
        <ProductGallery images={product.images} title={product.title} />
        <ProductDetails product={product} />
      </div>

      <div className="mt-8 lg:mt-0">
        {!artist.isAcceptingOrders && (
          <PausedNotice className="mb-5">
            {artist.name} has paused new orders for now. Check back soon, or browse other artists.
          </PausedNotice>
        )}
        <CustomizationForm
          productId={product._id}
          basePrice={product.basePrice}
          customFields={product.customFields}
          maxRevisions={product.maxRevisions}
          artistName={artist.name}
          makingTimeDays={artist.makingTimeDays}
          isAcceptingOrders={artist.isAcceptingOrders}
          // Computed here, at request time and in Indian time, so the
          // browser's clock and time zone don't matter.
          delivery={deliveryWindow(artist.makingTimeDays)}
        />
      </div>
    </div>
  );
}
