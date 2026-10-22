import { isMockMode } from "@/lib/store";

/** Makes it obvious when the app is running on in-memory demo data. */
export function MockDataBanner() {
  if (!isMockMode()) return null;
  return (
    <div className="bg-foreground px-4 py-1.5 text-center text-xs text-background">
      Mock data — no database connected. Changes reset when the server restarts.
    </div>
  );
}
