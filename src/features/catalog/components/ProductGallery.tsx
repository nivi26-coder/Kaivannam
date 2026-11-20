import Image from "next/image";

/** Swipeable on phones; a simple grid on large screens. */
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-2 lg:overflow-visible">
      {images.map((src, index) => (
        <div
          key={src}
          className="relative aspect-square w-[85%] shrink-0 snap-center overflow-hidden rounded-xl bg-muted sm:w-full lg:first:col-span-2"
        >
          <Image
            src={src}
            alt={index === 0 ? title : `${title}, photo ${index + 1}`}
            fill
            preload={index === 0}
            sizes="(min-width: 1024px) 480px, 85vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
