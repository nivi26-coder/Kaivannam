import Link from "next/link";
import { Store } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-heading text-xl font-semibold tracking-tight text-primary">
            Kaivannam
          </span>
          <span lang="ta" className="font-tamil text-sm text-muted-foreground">
            கைவண்ணம்
          </span>
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          <Store className="size-4" aria-hidden />
          For artists
        </Link>
      </div>
    </header>
  );
}
