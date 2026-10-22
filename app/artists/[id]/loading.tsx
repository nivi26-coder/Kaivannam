import { ProductGridSkeleton } from "@/components/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <div className="flex gap-4">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex-1 space-y-2 py-1">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <ProductGridSkeleton />
    </div>
  );
}
