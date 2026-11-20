import Image from "next/image";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ArtistAvatar({
  name,
  avatarUrl,
  size = 48,
  className,
}: {
  name: string;
  avatarUrl: string;
  size?: number;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover ring-2 ring-background", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-accent font-semibold text-accent-foreground",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}
