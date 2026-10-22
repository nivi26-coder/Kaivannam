import "server-only";
import { mockStore } from "./mock";
import { mongoStore } from "./mongo";
import type { Store } from "./types";

/**
 * No MONGODB_URI -> run on in-memory demo data, so the app works before
 * Atlas is set up. Add the variable to .env.local and restart to switch.
 */
export function isMockMode(): boolean {
  return !process.env.MONGODB_URI;
}

export function getStore(): Store {
  return isMockMode() ? mockStore : mongoStore;
}
