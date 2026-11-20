import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-3 px-4 py-20 text-center">
      <p lang="ta" className="font-tamil text-primary">
        மன்னிக்கவும்
      </p>
      <h1 className="font-heading text-2xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="text-sm text-muted-foreground">
        The link may be wrong, or the gift or order may have been removed.
      </p>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-lg bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/85"
      >
        Browse gifts
      </Link>
    </div>
  );
}
