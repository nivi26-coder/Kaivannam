import { io } from "next/cache";
import { isMockMode } from "@/lib/store";

/**
 * Makes it obvious when the app is running on in-memory demo data.
 *
 * `await io()` makes this decide per request, not at build time. Otherwise a
 * build made without MONGODB_URI would bake the banner into the prerendered
 * page and keep showing it after the database is connected. Render it inside
 * <Suspense> (see app/layout.tsx).
 */
export async function MockDataBanner() {
  await io();
  if (!isMockMode()) return null;
  return (
    <div className="bg-foreground px-4 py-1.5 text-center text-xs text-background">
      Mock data · no database connected
      <span className="hidden sm:inline"> · changes reset when the server restarts</span>
    </div>
  );
}
